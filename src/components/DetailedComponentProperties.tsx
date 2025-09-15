import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Settings, 
  Ruler, 
  Weight, 
  Palette, 
  Wind,
  Calculator,
  Info,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import type { RocketComponent } from "./RocketDesigner";

interface DetailedComponentPropertiesProps {
  component: RocketComponent | null;
  onComponentUpdate: (id: string, updates: Partial<RocketComponent>) => void;
  onClose: () => void;
}

interface MaterialProperty {
  name: string;
  density: number; // kg/m³
  tensileStrength: number; // MPa
  cost: number; // relative cost factor
  description: string;
}

const MATERIALS: Record<string, MaterialProperty> = {
  cardboard: {
    name: "Cardboard",
    density: 700,
    tensileStrength: 2,
    cost: 1,
    description: "Basic paper tube, suitable for low-power rockets"
  },
  phenolic: {
    name: "Phenolic",
    density: 1350,
    tensileStrength: 55,
    cost: 3,
    description: "High-strength paper-phenolic composite"
  },
  fiberglass: {
    name: "Fiberglass",
    density: 1800,
    tensileStrength: 400,
    cost: 5,
    description: "Glass fiber reinforced plastic"
  },
  carbonFiber: {
    name: "Carbon Fiber",
    density: 1600,
    tensileStrength: 600,
    cost: 10,
    description: "Ultra-lightweight, high-strength carbon composite"
  },
  aluminum: {
    name: "Aluminum",
    density: 2700,
    tensileStrength: 310,
    cost: 4,
    description: "Lightweight metal construction"
  },
  plastic: {
    name: "ABS Plastic",
    density: 1050,
    tensileStrength: 40,
    cost: 2,
    description: "Injection molded thermoplastic"
  }
};

export const DetailedComponentProperties = ({ 
  component, 
  onComponentUpdate, 
  onClose 
}: DetailedComponentPropertiesProps) => {
  const [localComponent, setLocalComponent] = useState<RocketComponent | null>(component);
  const [material, setMaterial] = useState("cardboard");
  const [thickness, setThickness] = useState([2]); // mm
  const [finCount, setFinCount] = useState([3]);
  const [finSweep, setFinSweep] = useState([0]); // degrees
  const [finThickness, setFinThickness] = useState([3]); // mm

  useEffect(() => {
    setLocalComponent(component);
  }, [component]);

  if (!localComponent) return null;

  const updateProperty = (property: string, value: any) => {
    const updated = { ...localComponent, [property]: value };
    setLocalComponent(updated);
    onComponentUpdate(localComponent.id, { [property]: value });
  };

  const calculateMass = () => {
    const mat = MATERIALS[material];
    let volume = 0;

    switch (localComponent.type) {
      case 'bodytube':
        const radius = localComponent.width / 2 / 100; // Convert to meters
        const length = localComponent.height / 100;
        const innerRadius = Math.max(0, radius - thickness[0] / 1000);
        volume = Math.PI * length * (radius * radius - innerRadius * innerRadius);
        break;
      
      case 'nosecone':
        const noseRadius = localComponent.width / 2 / 100;
        const noseLength = localComponent.height / 100;
        volume = (Math.PI * noseRadius * noseRadius * noseLength) / 3 * 0.6; // Hollow cone approximation
        break;
      
      case 'fins':
        const finArea = (localComponent.width * localComponent.height) / 10000; // Convert to m²
        volume = finArea * finThickness[0] / 1000 * finCount[0];
        break;
      
      default:
        volume = (localComponent.width * localComponent.height * 10) / 1000000; // Rough approximation
    }

    const mass = volume * mat.density / 1000; // Convert to kg
    updateProperty('mass', parseFloat(mass.toFixed(4)));
  };

  const calculateDragCoefficient = () => {
    let cd = 0.45; // Default

    switch (localComponent.type) {
      case 'nosecone':
        cd = 0.15; // Streamlined nose
        break;
      case 'bodytube':
        cd = 0.45; // Cylindrical body
        break;
      case 'fins':
        cd = 0.02 * finCount[0]; // Fin drag
        break;
      case 'parachute':
        cd = 1.3; // Deployed parachute
        break;
    }

    updateProperty('dragCoefficient', cd);
  };

  const getComponentValidation = () => {
    const warnings = [];
    const errors = [];

    // Dimension validation
    if (localComponent.width <= 0 || localComponent.height <= 0) {
      errors.push("Component dimensions must be positive");
    }

    // Material-specific validation
    const mat = MATERIALS[material];
    if (localComponent.type === 'bodytube' && thickness[0] < 1) {
      warnings.push("Very thin wall thickness may compromise structural integrity");
    }

    if (localComponent.type === 'fins' && finCount[0] < 3) {
      warnings.push("Less than 3 fins may cause instability");
    }

    if (localComponent.mass > 1) {
      warnings.push("Heavy component may affect performance");
    }

    return { warnings, errors };
  };

  const validation = getComponentValidation();

  return (
    <Card className="w-96 h-[600px] cosmic-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Component Properties</h3>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        
        <div className="mt-2">
          <Badge variant="outline" className="mr-2">
            {localComponent.type.charAt(0).toUpperCase() + localComponent.type.slice(1)}
          </Badge>
          <Badge variant="outline">
            ID: {localComponent.id.split('-')[1]}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="dimensions" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mx-4 mt-4">
            <TabsTrigger value="dimensions">Dimensions</TabsTrigger>
            <TabsTrigger value="material">Material</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto p-4">
            <TabsContent value="dimensions" className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label className="flex items-center gap-2">
                    <Ruler className="h-4 w-4" />
                    Width (mm)
                  </Label>
                  <Input
                    type="number"
                    value={localComponent.width}
                    onChange={(e) => updateProperty('width', parseFloat(e.target.value) || 0)}
                    min="1"
                    max="200"
                  />
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    <Ruler className="h-4 w-4" />
                    Height (mm)
                  </Label>
                  <Input
                    type="number"
                    value={localComponent.height}
                    onChange={(e) => updateProperty('height', parseFloat(e.target.value) || 0)}
                    min="1"
                    max="500"
                  />
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Color
                  </Label>
                  <Input
                    type="color"
                    value={localComponent.color}
                    onChange={(e) => updateProperty('color', e.target.value)}
                  />
                </div>

                {localComponent.type === 'fins' && (
                  <>
                    <div>
                      <Label>Fin Count: {finCount[0]}</Label>
                      <Slider
                        value={finCount}
                        onValueChange={setFinCount}
                        min={3}
                        max={8}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                    
                    <div>
                      <Label>Sweep Angle: {finSweep[0]}°</Label>
                      <Slider
                        value={finSweep}
                        onValueChange={setFinSweep}
                        min={0}
                        max={45}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="material" className="space-y-4">
              <div>
                <Label>Material Type</Label>
                <Select value={material} onValueChange={setMaterial}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MATERIALS).map(([key, mat]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center justify-between w-full">
                          <span>{mat.name}</span>
                          <Badge variant="outline" className="ml-2">
                            {mat.cost}x cost
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <p className="text-xs text-muted-foreground mt-1">
                  {MATERIALS[material].description}
                </p>
              </div>

              <div className="bg-muted/50 p-3 rounded-lg">
                <h4 className="font-medium mb-2">Material Properties</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Density:</span>
                    <span>{MATERIALS[material].density} kg/m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Strength:</span>
                    <span>{MATERIALS[material].tensileStrength} MPa</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cost Factor:</span>
                    <span>{MATERIALS[material].cost}x</span>
                  </div>
                </div>
              </div>

              {(localComponent.type === 'bodytube' || localComponent.type === 'nosecone') && (
                <div>
                  <Label>Wall Thickness: {thickness[0]} mm</Label>
                  <Slider
                    value={thickness}
                    onValueChange={setThickness}
                    min={0.5}
                    max={10}
                    step={0.1}
                    className="mt-2"
                  />
                </div>
              )}

              {localComponent.type === 'fins' && (
                <div>
                  <Label>Fin Thickness: {finThickness[0]} mm</Label>
                  <Slider
                    value={finThickness}
                    onValueChange={setFinThickness}
                    min={1}
                    max={12}
                    step={0.5}
                    className="mt-2"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={calculateMass} size="sm" className="flex-1">
                  <Calculator className="h-4 w-4 mr-2" />
                  Calculate Mass
                </Button>
                <Button onClick={calculateDragCoefficient} size="sm" variant="outline" className="flex-1">
                  <Wind className="h-4 w-4 mr-2" />
                  Calculate Drag
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label className="flex items-center gap-2">
                    <Weight className="h-4 w-4" />
                    Mass (kg)
                  </Label>
                  <Input
                    type="number"
                    value={localComponent.mass}
                    onChange={(e) => updateProperty('mass', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.001"
                  />
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    <Wind className="h-4 w-4" />
                    Drag Coefficient
                  </Label>
                  <Input
                    type="number"
                    value={localComponent.dragCoefficient}
                    onChange={(e) => updateProperty('dragCoefficient', parseFloat(e.target.value) || 0)}
                    min="0"
                    max="2"
                    step="0.01"
                  />
                </div>

                <div>
                  <Label>Component Name</Label>
                  <Input
                    value={localComponent.name}
                    onChange={(e) => updateProperty('name', e.target.value)}
                    placeholder="Custom component name"
                  />
                </div>
              </div>

              <Separator />

              {/* Validation Results */}
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Validation
                </h4>
                
                <div className="space-y-2">
                  {validation.errors.map((error, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                      {error}
                    </div>
                  ))}
                  
                  {validation.warnings.map((warning, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-rocket-warning">
                      <AlertTriangle className="h-4 w-4" />
                      {warning}
                    </div>
                  ))}
                  
                  {validation.errors.length === 0 && validation.warnings.length === 0 && (
                    <div className="flex items-center gap-2 text-sm text-rocket-success">
                      <CheckCircle className="h-4 w-4" />
                      Component configuration is valid
                    </div>
                  )}
                </div>
              </div>

              {/* Component Stats Summary */}
              <div className="bg-muted/50 p-3 rounded-lg">
                <h4 className="font-medium mb-2">Component Summary</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>Volume: {((localComponent.width * localComponent.height * 10) / 1000000).toFixed(6)} m³</div>
                  <div>Density: {(localComponent.mass / ((localComponent.width * localComponent.height * 10) / 1000000)).toFixed(0)} kg/m³</div>
                  <div>Surface Area: {((localComponent.width + localComponent.height) * 2 / 100).toFixed(3)} m²</div>
                  <div>Aspect Ratio: {(localComponent.height / localComponent.width).toFixed(2)}</div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </Card>
  );
};