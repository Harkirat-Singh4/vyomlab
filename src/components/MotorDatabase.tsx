import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  Zap, 
  Clock, 
  Weight, 
  TrendingUp,
  Filter,
  Star
} from "lucide-react";
import type { MotorData } from "./PhysicsEngine";

interface MotorDatabaseProps {
  selectedMotor: MotorData | null;
  onMotorSelect: (motor: MotorData) => void;
}

// Comprehensive motor database based on real NAR certified motors
const MOTOR_DATABASE: MotorData[] = [
  // A Class Motors
  {
    designation: "A8-3",
    totalImpulse: 2.5,
    burnTime: 0.5,
    averageThrust: 5.0,
    maxThrust: 12.15,
    propellantMass: 0.0018,
    totalMass: 0.0087,
    delay: 3,
    thrustCurve: [
      { time: 0, thrust: 0 },
      { time: 0.02, thrust: 12.15 },
      { time: 0.1, thrust: 8.5 },
      { time: 0.3, thrust: 5.2 },
      { time: 0.45, thrust: 3.1 },
      { time: 0.5, thrust: 0 }
    ]
  },
  {
    designation: "A10-3T",
    totalImpulse: 2.5,
    burnTime: 0.25,
    averageThrust: 10.0,
    maxThrust: 18.6,
    propellantMass: 0.0016,
    totalMass: 0.0083,
    delay: 3,
    thrustCurve: [
      { time: 0, thrust: 0 },
      { time: 0.01, thrust: 18.6 },
      { time: 0.05, thrust: 15.2 },
      { time: 0.15, thrust: 8.4 },
      { time: 0.22, thrust: 4.2 },
      { time: 0.25, thrust: 0 }
    ]
  },
  
  // B Class Motors
  {
    designation: "B6-4",
    totalImpulse: 5.0,
    burnTime: 0.8,
    averageThrust: 6.25,
    maxThrust: 12.8,
    propellantMass: 0.0032,
    totalMass: 0.0117,
    delay: 4,
    thrustCurve: [
      { time: 0, thrust: 0 },
      { time: 0.02, thrust: 12.8 },
      { time: 0.1, thrust: 10.1 },
      { time: 0.4, thrust: 6.8 },
      { time: 0.7, thrust: 4.2 },
      { time: 0.8, thrust: 0 }
    ]
  },
  {
    designation: "B4-2",
    totalImpulse: 5.0,
    burnTime: 1.2,
    averageThrust: 4.17,
    maxThrust: 8.4,
    propellantMass: 0.0035,
    totalMass: 0.0121,
    delay: 2,
    thrustCurve: [
      { time: 0, thrust: 0 },
      { time: 0.03, thrust: 8.4 },
      { time: 0.2, thrust: 6.2 },
      { time: 0.8, thrust: 3.8 },
      { time: 1.1, thrust: 2.1 },
      { time: 1.2, thrust: 0 }
    ]
  },

  // C Class Motors
  {
    designation: "C6-5",
    totalImpulse: 10.0,
    burnTime: 1.6,
    averageThrust: 6.25,
    maxThrust: 14.2,
    propellantMass: 0.0065,
    totalMass: 0.0186,
    delay: 5,
    thrustCurve: [
      { time: 0, thrust: 0 },
      { time: 0.04, thrust: 14.2 },
      { time: 0.2, thrust: 11.8 },
      { time: 0.8, thrust: 7.2 },
      { time: 1.4, thrust: 3.8 },
      { time: 1.6, thrust: 0 }
    ]
  },
  {
    designation: "C11-3",
    totalImpulse: 10.0,
    burnTime: 0.9,
    averageThrust: 11.1,
    maxThrust: 24.5,
    propellantMass: 0.0058,
    totalMass: 0.0179,
    delay: 3,
    thrustCurve: [
      { time: 0, thrust: 0 },
      { time: 0.02, thrust: 24.5 },
      { time: 0.1, thrust: 18.2 },
      { time: 0.5, thrust: 10.8 },
      { time: 0.8, thrust: 5.4 },
      { time: 0.9, thrust: 0 }
    ]
  },

  // D Class Motors
  {
    designation: "D12-5",
    totalImpulse: 20.0,
    burnTime: 1.7,
    averageThrust: 11.8,
    maxThrust: 25.8,
    propellantMass: 0.0127,
    totalMass: 0.0378,
    delay: 5,
    thrustCurve: [
      { time: 0, thrust: 0 },
      { time: 0.05, thrust: 25.8 },
      { time: 0.3, thrust: 20.4 },
      { time: 0.9, thrust: 12.6 },
      { time: 1.5, thrust: 6.8 },
      { time: 1.7, thrust: 0 }
    ]
  },
  {
    designation: "D15-4",
    totalImpulse: 20.0,
    burnTime: 1.3,
    averageThrust: 15.4,
    maxThrust: 32.1,
    propellantMass: 0.0118,
    totalMass: 0.0369,
    delay: 4,
    thrustCurve: [
      { time: 0, thrust: 0 },
      { time: 0.03, thrust: 32.1 },
      { time: 0.2, thrust: 26.8 },
      { time: 0.7, thrust: 15.2 },
      { time: 1.1, thrust: 8.4 },
      { time: 1.3, thrust: 0 }
    ]
  },

  // E Class Motors
  {
    designation: "E9-6",
    totalImpulse: 40.0,
    burnTime: 4.5,
    averageThrust: 8.9,
    maxThrust: 18.6,
    propellantMass: 0.0254,
    totalMass: 0.0756,
    delay: 6,
    thrustCurve: [
      { time: 0, thrust: 0 },
      { time: 0.1, thrust: 18.6 },
      { time: 0.8, thrust: 15.2 },
      { time: 2.5, thrust: 9.8 },
      { time: 4.0, thrust: 4.2 },
      { time: 4.5, thrust: 0 }
    ]
  },
  {
    designation: "E12-4",
    totalImpulse: 40.0,
    burnTime: 3.2,
    averageThrust: 12.5,
    maxThrust: 28.4,
    propellantMass: 0.0241,
    totalMass: 0.0743,
    delay: 4,
    thrustCurve: [
      { time: 0, thrust: 0 },
      { time: 0.08, thrust: 28.4 },
      { time: 0.5, thrust: 22.1 },
      { time: 1.8, thrust: 12.8 },
      { time: 2.8, thrust: 6.4 },
      { time: 3.2, thrust: 0 }
    ]
  },

  // F Class Motors (High Power)
  {
    designation: "F15-4",
    totalImpulse: 80.0,
    burnTime: 5.3,
    averageThrust: 15.1,
    maxThrust: 32.8,
    propellantMass: 0.0485,
    totalMass: 0.1458,
    delay: 4,
    thrustCurve: [
      { time: 0, thrust: 0 },
      { time: 0.12, thrust: 32.8 },
      { time: 0.8, thrust: 28.4 },
      { time: 3.0, thrust: 15.8 },
      { time: 4.8, thrust: 7.2 },
      { time: 5.3, thrust: 0 }
    ]
  }
];

export const MotorDatabase = ({ selectedMotor, onMotorSelect }: MotorDatabaseProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");

  const filteredMotors = MOTOR_DATABASE.filter(motor => {
    const matchesSearch = motor.designation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = classFilter === "all" || motor.designation.startsWith(classFilter.toUpperCase());
    return matchesSearch && matchesClass;
  });

  const motorClasses = ["all", "a", "b", "c", "d", "e", "f"];

  const formatNumber = (num: number, decimals: number = 1) => {
    return num.toFixed(decimals);
  };

  return (
    <Card className="h-full cosmic-border">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-rocket-thrust" />
          <h3 className="font-semibold">Motor Database</h3>
          <Badge variant="outline" className="ml-auto">
            {MOTOR_DATABASE.length} Motors
          </Badge>
        </div>

        {/* Search and Filter */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search motors (e.g., C6-5, D12)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <div className="flex gap-1">
              {motorClasses.map(cls => (
                <Button
                  key={cls}
                  variant={classFilter === cls ? "default" : "outline"}
                  size="sm"
                  onClick={() => setClassFilter(cls)}
                  className="h-7 px-2"
                >
                  {cls === "all" ? "All" : cls.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Motor List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {filteredMotors.map((motor) => (
            <Card
              key={motor.designation}
              className={`p-3 cursor-pointer transition-all hover:bg-accent/50 ${
                selectedMotor?.designation === motor.designation 
                  ? 'ring-2 ring-primary bg-accent/30' 
                  : ''
              }`}
              onClick={() => onMotorSelect(motor)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-lg">{motor.designation}</h4>
                  {motor.designation.startsWith('E') || motor.designation.startsWith('F') && (
                    <Star className="h-4 w-4 text-rocket-warning" />
                  )}
                </div>
                <Badge 
                  variant="outline" 
                  className="text-xs"
                  style={{ 
                    backgroundColor: `hsl(${15 + motor.designation.charCodeAt(0) * 30} 70% 50% / 0.1)`,
                    borderColor: `hsl(${15 + motor.designation.charCodeAt(0) * 30} 70% 50% / 0.3)`
                  }}
                >
                  Class {motor.designation.charAt(0)}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-rocket-success" />
                  <span className="text-muted-foreground">Impulse:</span>
                  <span className="font-medium">{formatNumber(motor.totalImpulse)} N⋅s</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-primary" />
                  <span className="text-muted-foreground">Burn:</span>
                  <span className="font-medium">{formatNumber(motor.burnTime)} s</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-rocket-thrust" />
                  <span className="text-muted-foreground">Avg Thrust:</span>
                  <span className="font-medium">{formatNumber(motor.averageThrust)} N</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Weight className="h-3 w-3 text-accent" />
                  <span className="text-muted-foreground">Mass:</span>
                  <span className="font-medium">{formatNumber(motor.totalMass * 1000)} g</span>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-border/50">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Max Thrust: <span className="font-medium">{formatNumber(motor.maxThrust)} N</span>
                  </span>
                  <span className="text-muted-foreground">
                    Delay: <span className="font-medium">{motor.delay} s</span>
                  </span>
                </div>
              </div>
            </Card>
          ))}

          {filteredMotors.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No motors found matching your criteria</p>
              <p className="text-sm mt-1">Try adjusting your search or filter</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Selected Motor Details */}
      {selectedMotor && (
        <div className="p-4 border-t border-border bg-muted/20">
          <h4 className="font-semibold mb-2">Selected: {selectedMotor.designation}</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Total Impulse:</span>
              <span className="ml-1 font-medium">{formatNumber(selectedMotor.totalImpulse)} N⋅s</span>
            </div>
            <div>
              <span className="text-muted-foreground">Propellant:</span>
              <span className="ml-1 font-medium">{formatNumber(selectedMotor.propellantMass * 1000)} g</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};