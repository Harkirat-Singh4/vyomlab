import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Navigation, 
  Cylinder, 
  Triangle, 
  Zap, 
  Shield, 
  Circle,
  Cpu,
  Radio,
  Satellite,
  Camera,
  Thermometer,
  Wind,
  Compass,
  Battery,
  ArrowUp,
  Umbrella
} from "lucide-react";

export interface ComponentData {
  id: string;
  type: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  defaultProps: {
    width: number;
    height: number;
    mass: number;
    dragCoefficient: number;
    color: string;
    material?: string;
    thickness?: number;
  };
  category: string;
}

const COMPONENT_LIBRARY: ComponentData[] = [
  {
    id: "nosecone-1",
    type: "nosecone",
    name: "Conical Nose Cone", 
    description: "Reduces drag, guides airflow",
    icon: Navigation,
    defaultProps: {
      width: 40,
      height: 60,
      mass: 0.05,
      dragCoefficient: 0.15,
      color: "bg-gradient-to-b from-red-500 to-red-600"
    },
    category: "structure"
  },
  {
    id: "bodytube-1",
    type: "bodytube",
    name: "Body Tube",
    description: "Main structural component",
    icon: Cylinder,
    defaultProps: {
      width: 40,
      height: 100,
      mass: 0.15,
      dragCoefficient: 0.45,
      color: "bg-gradient-to-b from-blue-500 to-blue-600"
    },
    category: "structure"
  },
  {
    id: "fins-1",
    type: "fins",
    name: "Fin Set",
    description: "Provides stability and control",
    icon: Triangle,
    defaultProps: {
      width: 60,
      height: 40,
      mass: 0.08,
      dragCoefficient: 0.02,
      color: "bg-gradient-to-b from-green-500 to-green-600"
    },
    category: "stability"
  },
  {
    id: "engine-1",
    type: "engine",
    name: "Solid Motor",
    description: "Propulsion system",
    icon: Zap,
    defaultProps: {
      width: 35,
      height: 80,
      mass: 0.25,
      dragCoefficient: 0.0,
      color: "bg-gradient-to-b from-amber-500 to-amber-600"
    },
    category: "propulsion"
  },
  {
    id: "transition-1",
    type: "transition",
    name: "Transition",
    description: "Connects different diameters",
    icon: ArrowUp,
    defaultProps: {
      width: 40,
      height: 30,
      mass: 0.03,
      dragCoefficient: 0.25,
      color: "bg-gradient-to-b from-purple-500 to-purple-600"
    },
    category: "structure"
  },
  {
    id: "parachute-1",
    type: "parachute",
    name: "Recovery System",
    description: "Safe landing system",
    icon: Umbrella,
    defaultProps: {
      width: 30,
      height: 25,
      mass: 0.04,
      dragCoefficient: 1.3,
      color: "bg-gradient-to-b from-pink-500 to-pink-600"
    },
    category: "recovery"
  }
];

interface ComponentLibraryProps {
  onComponentDrag?: (component: ComponentData) => void;
}

export const ComponentLibrary = ({ onComponentDrag }: ComponentLibraryProps = {}) => {
  const handleDragStart = (e: React.DragEvent, component: ComponentData) => {
    e.dataTransfer.setData("application/json", JSON.stringify(component));
    e.dataTransfer.effectAllowed = "copy";
    onComponentDrag?.(component);
  };

  return (
    <Card className="h-full p-4 cosmic-border">
      <div className="flex items-center gap-2 mb-4">
        <Cylinder className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Component Library</h3>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        Drag components to the canvas to build your rocket
      </p>
      
      <div className="space-y-3">
        {COMPONENT_LIBRARY.slice(0, 6).map((component) => (
          <div
            key={component.id}
            draggable
            onDragStart={(e) => handleDragStart(e, component)}
            className="group cursor-move"
          >
            <Card className="p-3 rocket-glow hover:border-primary/50 transition-all duration-200">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white flex-shrink-0 ${component.defaultProps.color}`}>
                  <component.icon className="h-5 w-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{component.name}</h4>
                  <p className="text-xs text-muted-foreground mb-2">{component.description}</p>
                  
                  <div className="flex items-center gap-1 flex-wrap">
                    <Badge variant="outline" className="text-xs px-1">
                      {(component.defaultProps.mass * 1000).toFixed(0)}g
                    </Badge>
                    <Badge variant="outline" className="text-xs px-1">
                      Cd {component.defaultProps.dragCoefficient}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>
      
      <Separator className="my-4" />
      
      <div className="space-y-2">
        <h4 className="font-medium text-sm">Quick Tips</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Start with a nose cone at the top</li>
          <li>• Add body tubes for structure</li>
          <li>• Place fins at the bottom for stability</li>
          <li>• Add engines for propulsion</li>
          <li>• Include recovery systems</li>
        </ul>
      </div>
    </Card>
  );
};