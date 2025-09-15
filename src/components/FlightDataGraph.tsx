import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  Bar
} from "recharts";
import { 
  BarChart3, 
  TrendingUp, 
  Gauge, 
  Activity, 
  Target,
  Download,
  ZoomIn,
  Grid3X3
} from "lucide-react";
import type { FlightDataPoint } from "./PhysicsEngine";

interface FlightDataGraphProps {
  flightData: FlightDataPoint[];
  isSimulating: boolean;
}

export const FlightDataGraph = ({ flightData, isSimulating }: FlightDataGraphProps) => {
  const [activeGraph, setActiveGraph] = useState("altitude");
  const [showGrid, setShowGrid] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);

  const formatTime = (time: number) => `${time.toFixed(1)}s`;
  const formatAltitude = (alt: number) => `${alt.toFixed(0)}m`;
  const formatVelocity = (vel: number) => `${vel.toFixed(1)} m/s`;
  const formatAcceleration = (acc: number) => `${acc.toFixed(1)} m/s²`;
  const formatThrust = (thrust: number) => `${thrust.toFixed(1)}N`;
  const formatMach = (mach: number) => `M${mach.toFixed(2)}`;

  // Calculate key flight metrics
  const maxAltitude = Math.max(...flightData.map(d => d.altitude));
  const maxVelocity = Math.max(...flightData.map(d => Math.abs(d.velocity)));
  const maxAcceleration = Math.max(...flightData.map(d => Math.abs(d.acceleration)));
  const maxMach = Math.max(...flightData.map(d => d.mach));
  const burnoutTime = flightData.find(d => d.thrust === 0 && d.time > 0.1)?.time || 0;
  const apogeeTime = flightData.find(d => d.altitude === maxAltitude)?.time || 0;
  const flightTime = flightData[flightData.length - 1]?.time || 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{`Time: ${formatTime(label)}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value.toFixed(2)}${entry.unit || ''}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const exportData = () => {
    const csvContent = [
      "Time(s),Altitude(m),Velocity(m/s),Acceleration(m/s²),Thrust(N),Drag(N),Mach,Mass(kg)",
      ...flightData.map(d => 
        `${d.time.toFixed(3)},${d.altitude.toFixed(2)},${d.velocity.toFixed(2)},${d.acceleration.toFixed(2)},${d.thrust.toFixed(2)},${d.drag.toFixed(2)},${d.mach.toFixed(3)},${d.mass.toFixed(4)}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flight-data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (flightData.length === 0) {
    return (
      <Card className="h-full cosmic-border flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Flight Data</h3>
          <p className="text-sm">Run a simulation to see flight graphs</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full cosmic-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Flight Analysis</h3>
            {isSimulating && (
              <Badge variant="outline" className="animate-pulse">
                <div className="w-2 h-2 bg-rocket-success rounded-full mr-1" />
                Live
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowGrid(!showGrid)}
              className={showGrid ? "bg-accent" : ""}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportData}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-muted/50 p-2 rounded text-center">
            <div className="text-xs text-muted-foreground">Max Alt</div>
            <div className="font-bold text-rocket-success">{formatAltitude(maxAltitude)}</div>
          </div>
          <div className="bg-muted/50 p-2 rounded text-center">
            <div className="text-xs text-muted-foreground">Max Vel</div>
            <div className="font-bold text-primary">{formatVelocity(maxVelocity)}</div>
          </div>
          <div className="bg-muted/50 p-2 rounded text-center">
            <div className="text-xs text-muted-foreground">Max Mach</div>
            <div className="font-bold text-rocket-warning">{formatMach(maxMach)}</div>
          </div>
          <div className="bg-muted/50 p-2 rounded text-center">
            <div className="text-xs text-muted-foreground">Flight Time</div>
            <div className="font-bold text-accent">{formatTime(flightTime)}</div>
          </div>
        </div>
      </div>

      {/* Graph Content */}
      <div className="flex-1 p-4">
        <Tabs value={activeGraph} onValueChange={setActiveGraph} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="altitude" className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Altitude
            </TabsTrigger>
            <TabsTrigger value="velocity" className="flex items-center gap-1">
              <Gauge className="h-3 w-3" />
              Velocity
            </TabsTrigger>
            <TabsTrigger value="forces" className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              Forces
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              Performance
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 mt-4">
            <TabsContent value="altitude" className="h-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={flightData}>
                  {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />}
                  <XAxis 
                    dataKey="time" 
                    tickFormatter={formatTime}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis 
                    tickFormatter={formatAltitude}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="altitude"
                    stroke="hsl(var(--rocket-success))"
                    fill="hsl(var(--rocket-success) / 0.3)"
                    strokeWidth={2}
                    name="Altitude"
                    unit=" m"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="velocity" className="h-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={flightData}>
                  {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />}
                  <XAxis 
                    dataKey="time" 
                    tickFormatter={formatTime}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis 
                    yAxisId="velocity"
                    tickFormatter={formatVelocity}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis 
                    yAxisId="mach"
                    orientation="right"
                    tickFormatter={formatMach}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    yAxisId="velocity"
                    type="monotone"
                    dataKey="velocity"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                    name="Velocity"
                    unit=" m/s"
                  />
                  <Line
                    yAxisId="mach"
                    type="monotone"
                    dataKey="mach"
                    stroke="hsl(var(--rocket-warning))"
                    strokeWidth={2}
                    dot={false}
                    name="Mach Number"
                    strokeDasharray="5 5"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="forces" className="h-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={flightData}>
                  {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />}
                  <XAxis 
                    dataKey="time" 
                    tickFormatter={formatTime}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis 
                    tickFormatter={formatThrust}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="thrust"
                    fill="hsl(var(--rocket-thrust) / 0.7)"
                    name="Thrust"
                    unit=" N"
                  />
                  <Line
                    type="monotone"
                    dataKey="drag"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={2}
                    dot={false}
                    name="Drag"
                    unit=" N"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="performance" className="h-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={flightData}>
                  {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />}
                  <XAxis 
                    dataKey="time" 
                    tickFormatter={formatTime}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis 
                    yAxisId="accel"
                    tickFormatter={formatAcceleration}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis 
                    yAxisId="mass"
                    orientation="right"
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    yAxisId="accel"
                    type="monotone"
                    dataKey="acceleration"
                    stroke="hsl(var(--accent))"
                    fill="hsl(var(--accent) / 0.3)"
                    strokeWidth={2}
                    name="Acceleration"
                    unit=" m/s²"
                  />
                  <Line
                    yAxisId="mass"
                    type="monotone"
                    dataKey="mass"
                    stroke="hsl(var(--rocket-metal))"
                    strokeWidth={2}
                    dot={false}
                    name="Mass"
                    unit=" kg"
                    strokeDasharray="3 3"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Flight Events */}
      <div className="p-4 border-t border-border bg-muted/20">
        <h4 className="font-medium mb-2">Flight Events</h4>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Burnout:</span>
            <span className="ml-1 font-medium">{formatTime(burnoutTime)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Apogee:</span>
            <span className="ml-1 font-medium">{formatTime(apogeeTime)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Landing:</span>
            <span className="ml-1 font-medium">{formatTime(flightTime)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};