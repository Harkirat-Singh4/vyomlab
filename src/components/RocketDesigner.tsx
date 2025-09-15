import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Rocket, Zap, BarChart3, Settings, Play, Pause, Database, Target } from "lucide-react";
import { ComponentLibrary } from "./ComponentLibrary";
import { RocketCanvas } from "./RocketCanvas";
import { SimulationPanel } from "./SimulationPanel";
import { AIAssistant } from "./AIAssistant";
import { MotorDatabase } from "./MotorDatabase";
import { DetailedComponentProperties } from "./DetailedComponentProperties";
import { FlightDataGraph } from "./FlightDataGraph";
import { StabilityAnalysis } from "./StabilityAnalysis";
import { PhysicsEngine, type FlightDataPoint, type MotorData } from "./PhysicsEngine";

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
  const [selectedMotor, setSelectedMotor] = useState<MotorData | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeTab, setActiveTab] = useState<"design" | "simulate" | "analyze" | "motors" | "stability">("design");
  const [flightData, setFlightData] = useState<FlightDataPoint[]>([]);
  const [showComponentProps, setShowComponentProps] = useState(false);
  const physicsEngine = new PhysicsEngine();
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
    if (!isSimulating && selectedMotor) {
      // Start simulation with selected motor
      const rocketPhysics = {
        totalMass: components.reduce((sum, comp) => sum + comp.mass, 0) + (selectedMotor?.totalMass || 0),
        dryMass: components.reduce((sum, comp) => sum + comp.mass, 0),
        propellantMass: selectedMotor?.propellantMass || 0,
        centerOfGravity: physicsEngine.calculateCenterOfGravity(components),
        centerOfPressure: physicsEngine.calculateCenterOfPressure(components),
        stabilityMargin: 0,
        dragCoefficient: components.reduce((sum, comp) => sum + comp.dragCoefficient, 0),
        referenceArea: Math.PI * Math.pow(Math.max(...components.map(c => c.width)) / 2000, 2),
        length: Math.max(...components.map(c => c.y + c.height)) / 1000,
        diameter: Math.max(...components.map(c => c.width)) / 1000
      };

      const launchConditions = {
        altitude: 0,
        temperature: 20,
        pressure: 101325,
        humidity: 0.5,
        windSpeed: 5,
        windDirection: 0,
        launchAngle: 90,
        launchDirection: 0,
        rodLength: 1
      };

      const results = physicsEngine.runFullSimulation(rocketPhysics, selectedMotor, launchConditions);
      setFlightData(results);
      setActiveTab("analyze");
    }
    
    setIsSimulating(!isSimulating);
  };

  const tabs = [
    { id: "design", label: "Design", icon: Rocket },
    { id: "motors", label: "Motors", icon: Database },
    { id: "stability", label: "Stability", icon: Target },
    { id: "simulate", label: "Simulate", icon: Zap },
    { id: "analyze", label: "Analysis", icon: BarChart3 },
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
                disabled={!selectedMotor || components.length === 0}
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
          {/* Left Panel - Component Library or Motor Database */}
          <div className="col-span-3">
            {activeTab === "motors" ? (
              <MotorDatabase 
                selectedMotor={selectedMotor}
                onMotorSelect={setSelectedMotor}
              />
            ) : (
              <ComponentLibrary />
            )}
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
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Component Properties</h3>
                  </div>
                  {selectedComponent && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowComponentProps(true)}
                    >
                      Edit
                    </Button>
                  )}
                </div>
                {selectedComponent ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Component selected: {components.find(c => c.id === selectedComponent)?.name}
                    </p>
                    <div className="text-xs space-y-1">
                      <div>Mass: {components.find(c => c.id === selectedComponent)?.mass.toFixed(4)} kg</div>
                      <div>Drag Cd: {components.find(c => c.id === selectedComponent)?.dragCoefficient.toFixed(3)}</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Select a component to edit its properties
                  </p>
                )}
              </Card>
            )}
            
            {activeTab === "stability" && (
              <StabilityAnalysis 
                components={components}
                selectedMotor={selectedMotor}
              />
            )}
            
            {(activeTab === "simulate" || activeTab === "analyze") && (
              activeTab === "analyze" ? (
                <FlightDataGraph 
                  flightData={flightData}
                  isSimulating={isSimulating}
                />
              ) : (
                <SimulationPanel 
                  components={components}
                  selectedMotor={selectedMotor}
                  isSimulating={isSimulating}
                  activeTab={activeTab}
                />
              )
            )}
            
            <AIAssistant components={components} selectedMotor={selectedMotor} />
          </div>
        </div>
        
        {/* Component Properties Modal */}
        {showComponentProps && selectedComponent && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <DetailedComponentProperties
              component={components.find(c => c.id === selectedComponent) || null}
              onComponentUpdate={handleComponentUpdate}
              onClose={() => setShowComponentProps(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
};