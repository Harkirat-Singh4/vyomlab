import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Rocket, Zap, BarChart3, Settings, Play, Pause } from "lucide-react";
import { ComponentLibrary } from "./ComponentLibrary";
import { RocketCanvas } from "./RocketCanvas";
import { SimulationPanel } from "./SimulationPanel";
import { AIAssistant } from "./AIAssistant";

export interface RocketComponent {
  id: string;
  type: "nosecone" | "bodytube" | "fins" | "engine" | "transition" | "parachute";
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  mass: number;
  dragCoefficient: number;
  color: string;
}

export const RocketDesigner = () => {
  const [components, setComponents] = useState<RocketComponent[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeTab, setActiveTab] = useState<"design" | "simulate" | "analyze">("design");
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const componentData = e.dataTransfer.getData("application/json");
    
    if (!componentData || !canvasRef.current) return;
    
    try {
      const component = JSON.parse(componentData);
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const newComponent: RocketComponent = {
        ...component,
        id: `${component.type}-${Date.now()}`,
        x: Math.max(0, x - component.width / 2),
        y: Math.max(0, y - component.height / 2),
      };
      
      setComponents(prev => [...prev, newComponent]);
    } catch (error) {
      console.error("Error parsing dropped component:", error);
    }
  };

  const handleComponentUpdate = (id: string, updates: Partial<RocketComponent>) => {
    setComponents(prev => 
      prev.map(comp => comp.id === id ? { ...comp, ...updates } : comp)
    );
  };

  const handleComponentDelete = (id: string) => {
    setComponents(prev => prev.filter(comp => comp.id !== id));
    if (selectedComponent === id) {
      setSelectedComponent(null);
    }
  };

  const toggleSimulation = () => {
    setIsSimulating(!isSimulating);
    if (!isSimulating) {
      setActiveTab("simulate");
    }
  };

  const tabs = [
    { id: "design", label: "Design", icon: Rocket },
    { id: "simulate", label: "Simulate", icon: Zap },
    { id: "analyze", label: "Analyze", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Rocket className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Virtual Rocketry Lab
                </h1>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-muted rounded-lg p-1">
                {tabs.map((tab) => (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab(tab.id as any)}
                    className="flex items-center gap-2"
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </Button>
                ))}
              </div>
              
              <Button
                onClick={toggleSimulation}
                variant={isSimulating ? "destructive" : "default"}
                size="sm"
                className="flex items-center gap-2"
              >
                {isSimulating ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isSimulating ? "Stop" : "Launch"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          {/* Component Library */}
          <div className="col-span-3">
            <ComponentLibrary />
          </div>
          
          {/* Canvas Area */}
          <div className="col-span-6">
            <Card className="h-full cosmic-border">
              <RocketCanvas
                ref={canvasRef}
                components={components}
                selectedComponent={selectedComponent}
                onComponentSelect={setSelectedComponent}
                onComponentUpdate={handleComponentUpdate}
                onComponentDelete={handleComponentDelete}
                onDrop={handleDrop}
                isSimulating={isSimulating}
              />
            </Card>
          </div>
          
          {/* Right Panel */}
          <div className="col-span-3 space-y-4">
            {activeTab === "design" && (
              <Card className="p-4 cosmic-border">
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Component Properties</h3>
                </div>
                {selectedComponent ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Configure the selected component properties
                    </p>
                    {/* Component properties will be implemented */}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Select a component to edit its properties
                  </p>
                )}
              </Card>
            )}
            
            {(activeTab === "simulate" || activeTab === "analyze") && (
              <SimulationPanel 
                components={components}
                isSimulating={isSimulating}
                activeTab={activeTab}
              />
            )}
            
            <AIAssistant components={components} />
          </div>
        </div>
      </div>
    </div>
  );
};