import { forwardRef, useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, RotateCcw, Move, Eye } from "lucide-react";
import type { RocketComponent } from "./RocketDesigner";

interface RocketCanvasProps {
  components: RocketComponent[];
  selectedComponent: string | null;
  onComponentSelect: (id: string | null) => void;
  onComponentUpdate: (id: string, updates: Partial<RocketComponent>) => void;
  onComponentDelete: (id: string) => void;
  onDrop: (e: React.DragEvent) => void;
  isSimulating: boolean;
}

export const RocketCanvas = forwardRef<HTMLDivElement, RocketCanvasProps>(({
  components,
  selectedComponent,
  onComponentSelect,
  onComponentUpdate,
  onComponentDelete,
  onDrop,
  isSimulating
}, ref) => {
  const [draggedComponent, setDraggedComponent] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [view, setView] = useState<"2d" | "3d">("2d");
  const canvasRef = useRef<HTMLDivElement>(null);

  // Calculate rocket metrics
  const totalMass = components.reduce((sum, comp) => sum + comp.mass, 0);
  const centerOfGravity = components.length > 0 
    ? components.reduce((sum, comp) => sum + (comp.y + comp.height/2) * comp.mass, 0) / totalMass
    : 0;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleComponentMouseDown = (e: React.MouseEvent, component: RocketComponent) => {
    if (isSimulating) return;
    
    e.stopPropagation();
    onComponentSelect(component.id);
    
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setDraggedComponent(component.id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedComponent || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;
    
    onComponentUpdate(draggedComponent, {
      x: Math.max(0, Math.min(x, rect.width - 100)),
      y: Math.max(0, Math.min(y, rect.height - 100))
    });
  };

  const handleMouseUp = () => {
    setDraggedComponent(null);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onComponentSelect(null);
    }
  };

  const clearCanvas = () => {
    components.forEach(comp => onComponentDelete(comp.id));
    onComponentSelect(null);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Canvas Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold">Rocket Design Canvas</h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Mass: {totalMass.toFixed(2)}kg
            </Badge>
            <Badge variant="outline" className="text-xs">
              CG: {centerOfGravity.toFixed(0)}px
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setView(view === "2d" ? "3d" : "2d")}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            {view.toUpperCase()}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearCanvas}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>

      {/* Canvas Area */}
      <div 
        ref={(el) => {
          canvasRef.current = el;
          if (ref) {
            if (typeof ref === 'function') ref(el);
            else ref.current = el;
          }
        }}
        className="flex-1 relative bg-gradient-space overflow-hidden cursor-crosshair"
        onDrop={onDrop}
        onDragOver={handleDragOver}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleCanvasClick}
      >
        {/* Grid Background */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--border)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}
        />
        
        {/* Center Line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-primary/30" />
        
        {/* Ground Line */}
        <div className="absolute bottom-8 left-0 right-0 h-px bg-rocket-success/50" />
        
        {/* Components */}
        {components.map((component) => (
          <div
            key={component.id}
            className={`absolute cursor-move transition-all duration-200 ${
              selectedComponent === component.id 
                ? 'ring-2 ring-primary shadow-glow' 
                : 'hover:ring-1 hover:ring-primary/50'
            } ${isSimulating ? 'pointer-events-none' : ''}`}
            style={{
              left: component.x,
              top: component.y,
              width: component.width,
              height: component.height,
              backgroundColor: component.color,
              borderRadius: component.type === 'nosecone' ? '50% 50% 0 0' :
                            component.type === 'fins' ? '0' :
                            component.type === 'parachute' ? '50%' : '4px'
            }}
            onMouseDown={(e) => handleComponentMouseDown(e, component)}
          >
            {/* Component Label */}
            <div className="absolute -top-6 left-0 text-xs text-foreground/70 whitespace-nowrap">
              {component.name}
            </div>
            
            {/* Thrust Effect for Engines */}
            {component.type === 'engine' && isSimulating && (
              <div 
                className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 thrust-glow"
                style={{
                  width: '8px',
                  height: '32px',
                  borderRadius: '0 0 50% 50%'
                }}
              />
            )}
          </div>
        ))}
        
        {/* Selected Component Actions */}
        {selectedComponent && !isSimulating && (
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onComponentDelete(selectedComponent)}
              className="flex items-center gap-2 bg-destructive/10 border-destructive/20"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        )}
        
        {/* Empty State */}
        {components.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Move className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Start Building Your Rocket</h3>
              <p className="text-sm">
                Drag components from the library to begin your design
              </p>
            </div>
          </div>
        )}
        
        {/* Center of Gravity Indicator */}
        {components.length > 0 && (
          <div 
            className="absolute left-1/2 w-8 h-1 bg-rocket-warning transform -translate-x-1/2"
            style={{ top: centerOfGravity }}
          >
            <div className="absolute -left-2 -top-1 w-12 h-3 bg-rocket-warning/20 rounded" />
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-rocket-warning whitespace-nowrap">
              CG
            </div>
          </div>
        )}
      </div>
    </div>
  );
});