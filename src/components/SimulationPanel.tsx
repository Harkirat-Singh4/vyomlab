import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  Wind, 
  Thermometer, 
  Gauge, 
  TrendingUp,
  Target,
  Clock,
  BarChart3
} from "lucide-react";
import type { RocketComponent } from "./RocketDesigner";

interface SimulationPanelProps {
  components: RocketComponent[];
  selectedMotor: any;
  isSimulating: boolean;
  activeTab: "simulate" | "analyze";
}

interface SimulationData {
  altitude: number;
  velocity: number;
  acceleration: number;
  time: number;
  maxAltitude: number;
  burnTime: number;
  stability: number;
}

export const SimulationPanel = ({ 
  components, 
  selectedMotor,
  isSimulating, 
  activeTab 
}: SimulationPanelProps) => {
  const [launchAngle, setLaunchAngle] = useState([90]);
  const [windSpeed, setWindSpeed] = useState([5]);
  const [temperature, setTemperature] = useState([20]);
  const [simulationData, setSimulationData] = useState<SimulationData>({
    altitude: 0,
    velocity: 0,
    acceleration: 0,
    time: 0,
    maxAltitude: 0,
    burnTime: 0,
    stability: 0
  });

  // Basic physics simulation
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setSimulationData(prev => {
        const dt = 0.1; // 100ms time step
        const newTime = prev.time + dt;
        
        // Simple rocket physics
        const engines = components.filter(c => c.type === 'engine');
        const totalMass = components.reduce((sum, comp) => sum + comp.mass, 0) || 1;
        const thrust = engines.length > 0 && newTime < (selectedMotor?.burnTime || 3) ? 
          (selectedMotor?.averageThrust || 50) : 0;
        const drag = -0.5 * prev.velocity * Math.abs(prev.velocity) * 0.01;
        const gravity = -9.81;
        
        const acceleration = (thrust + drag + gravity * totalMass) / totalMass;
        const newVelocity = Math.max(0, prev.velocity + acceleration * dt);
        const newAltitude = Math.max(0, prev.altitude + newVelocity * dt);
        
        const maxAlt = Math.max(prev.maxAltitude, newAltitude);
        
        // Stop simulation when rocket lands
        if (newAltitude <= 0 && prev.altitude > 0) {
          return {
            ...prev,
            velocity: 0,
            acceleration: 0,
            altitude: 0,
            maxAltitude: maxAlt
          };
        }
        
        return {
          time: newTime,
          altitude: newAltitude,
          velocity: newVelocity,
          acceleration,
          maxAltitude: maxAlt,
          burnTime: thrust > 0 ? newTime : prev.burnTime,
          stability: calculateStability()
        };
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isSimulating, components]);

  const calculateStability = () => {
    const fins = components.filter(c => c.type === 'fins');
    const engines = components.filter(c => c.type === 'engine');
    return fins.length > 0 && engines.length > 0 ? 85 + Math.random() * 10 : 50;
  };

  const resetSimulation = () => {
    setSimulationData({
      altitude: 0,
      velocity: 0,
      acceleration: 0,
      time: 0,
      maxAltitude: 0,
      burnTime: 0,
      stability: 0
    });
  };

  if (activeTab === "simulate") {
    if (!selectedMotor) {
      return (
        <Card className="p-4 cosmic-border">
          <div className="text-center text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Motor Selected</h3>
            <p className="text-sm">Select a motor from the Motors tab to enable simulation</p>
          </div>
        </Card>
      );
    }
    return (
      <div className="space-y-4">
        <Card className="p-4 cosmic-border">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-rocket-thrust" />
            <h3 className="font-semibold">Selected Motor</h3>
          </div>
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="font-medium text-lg">{selectedMotor.designation}</div>
            <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
              <div>Impulse: {selectedMotor.totalImpulse} N⋅s</div>
              <div>Burn: {selectedMotor.burnTime}s</div>
              <div>Avg Thrust: {selectedMotor.averageThrust}N</div>
              <div>Mass: {(selectedMotor.totalMass * 1000).toFixed(0)}g</div>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 cosmic-border">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Launch Parameters</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Launch Angle</label>
                <Badge variant="outline">{launchAngle[0]}°</Badge>
              </div>
              <Slider
                value={launchAngle}
                onValueChange={setLaunchAngle}
                max={90}
                min={45}
                step={1}
                className="w-full"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <Wind className="h-4 w-4" />
                  Wind Speed
                </label>
                <Badge variant="outline">{windSpeed[0]} m/s</Badge>
              </div>
              <Slider
                value={windSpeed}
                onValueChange={setWindSpeed}
                max={20}
                min={0}
                step={1}
                className="w-full"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <Thermometer className="h-4 w-4" />
                  Temperature
                </label>
                <Badge variant="outline">{temperature[0]}°C</Badge>
              </div>
              <Slider
                value={temperature}
                onValueChange={setTemperature}
                max={40}
                min={-10}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        </Card>

        <Card className="p-4 cosmic-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Live Telemetry</h3>
            {!isSimulating && simulationData.maxAltitude > 0 && (
              <Button variant="outline" size="sm" onClick={resetSimulation}>
                Reset
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-rocket-success" />
                <span className="text-xs text-muted-foreground">Altitude</span>
              </div>
              <p className="text-lg font-bold">
                {simulationData.altitude.toFixed(0)}m
              </p>
            </div>
            
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Gauge className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Velocity</span>
              </div>
              <p className="text-lg font-bold">
                {simulationData.velocity.toFixed(1)} m/s
              </p>
            </div>
            
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="h-4 w-4 text-rocket-warning" />
                <span className="text-xs text-muted-foreground">Acceleration</span>
              </div>
              <p className="text-lg font-bold">
                {simulationData.acceleration.toFixed(1)} m/s²
              </p>
            </div>
            
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-accent" />
                <span className="text-xs text-muted-foreground">Time</span>
              </div>
              <p className="text-lg font-bold">
                {simulationData.time.toFixed(1)}s
              </p>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Stability</span>
              <span className="text-sm text-muted-foreground">
                {simulationData.stability.toFixed(0)}%
              </span>
            </div>
            <Progress value={simulationData.stability} className="h-2" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <Card className="p-4 cosmic-border">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Flight Analysis</h3>
      </div>
      
      <div className="space-y-4">
        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Performance Summary</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Max Altitude:</span>
              <span className="font-medium">{simulationData.maxAltitude.toFixed(0)}m</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Burn Time:</span>
              <span className="font-medium">{simulationData.burnTime.toFixed(1)}s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Stability Margin:</span>
              <span className="font-medium">{simulationData.stability.toFixed(0)}%</span>
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div>
          <h4 className="font-medium mb-2">Optimization Suggestions</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Add more fins for better stability</li>
            <li>• Consider a lighter nose cone</li>
            <li>• Optimize body tube length</li>
            <li>• Add recovery system</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};