import { useRef, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Move3D, Eye, Zap } from "lucide-react";
import type { RocketComponent } from "./RocketDesigner";

interface RocketCanvas3DProps {
  components: RocketComponent[];
  selectedComponent: string | null;
  onComponentSelect: (id: string | null) => void;
  onComponentUpdate: (id: string, updates: Partial<RocketComponent>) => void;
  onComponentDelete: (id: string) => void;
  onDrop: (e: React.DragEvent) => void;
  isSimulating: boolean;
}

export const RocketCanvas3D = ({
  components,
  selectedComponent,
  onComponentSelect,
  onComponentUpdate,
  onComponentDelete,
  onDrop,
  isSimulating
}: RocketCanvas3DProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });

  // Calculate rocket metrics
  const totalMass = components.reduce((sum, comp) => sum + comp.mass, 0);
  const centerOfGravity = components.length > 0 
    ? components.reduce((sum, comp) => sum + (comp.y + comp.height/2) * comp.mass, 0) / totalMass
    : 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.fillStyle = 'hsl(var(--background))';
    ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

    // Draw 3D grid
    draw3DGrid(ctx, canvas.offsetWidth, canvas.offsetHeight);

    // Draw rocket in 3D perspective
    draw3DRocket(ctx, canvas.offsetWidth, canvas.offsetHeight);

  }, [components, rotation, zoom, selectedComponent, isSimulating]);

  const draw3DGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = 'hsl(var(--border))';
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.3;

    const centerX = width / 2;
    const centerY = height / 2;
    const gridSize = 20 * zoom;

    // Draw perspective grid
    for (let i = -10; i <= 10; i++) {
      // Vertical lines with perspective
      const x1 = centerX + i * gridSize;
      const y1 = centerY - 200 * zoom;
      const x2 = centerX + i * gridSize * Math.cos(rotation.y * 0.01);
      const y2 = centerY + 200 * zoom;
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Horizontal lines with perspective
      const y3 = centerY + i * gridSize;
      const x3 = centerX - 200 * zoom;
      const x4 = centerX + 200 * zoom * Math.cos(rotation.y * 0.01);
      
      ctx.beginPath();
      ctx.moveTo(x3, y3);
      ctx.lineTo(x4, y3);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  };

  const draw3DRocket = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const centerX = width / 2;
    const centerY = height / 2;

    // Sort components by Z-order for proper 3D rendering
    const sortedComponents = [...components].sort((a, b) => {
      const aZ = a.y * Math.sin(rotation.x * 0.01);
      const bZ = b.y * Math.sin(rotation.x * 0.01);
      return bZ - aZ;
    });

    sortedComponents.forEach(component => {
      ctx.save();
      
      // Apply 3D transformations
      const x3d = centerX + (component.x - 200) * zoom * Math.cos(rotation.y * 0.01);
      const y3d = centerY + (component.y - 200) * zoom * Math.cos(rotation.x * 0.01);
      const width3d = component.width * zoom;
      const height3d = component.height * zoom * Math.cos(rotation.x * 0.01);
      const depth = component.width * 0.5 * zoom * Math.sin(rotation.y * 0.01);

      // Draw component shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(x3d + depth, y3d + depth, width3d, height3d);

      // Draw component body
      const gradient = ctx.createLinearGradient(x3d, y3d, x3d + width3d, y3d + height3d);
      
      // Parse component color and create 3D effect
      const componentColor = getColorFromClass(component.color);
      gradient.addColorStop(0, componentColor.light);
      gradient.addColorStop(0.7, componentColor.base);
      gradient.addColorStop(1, componentColor.dark);
      
      ctx.fillStyle = gradient;

      // Draw different shapes based on component type
      switch (component.type) {
        case 'nosecone':
          draw3DNoseCone(ctx, x3d, y3d, width3d, height3d);
          break;
        case 'fins':
          draw3DFins(ctx, x3d, y3d, width3d, height3d);
          break;
        case 'parachute':
          draw3DParachute(ctx, x3d, y3d, width3d, height3d);
          break;
        default:
          ctx.fillRect(x3d, y3d, width3d, height3d);
          // Draw 3D depth
          ctx.fillStyle = componentColor.dark;
          ctx.fillRect(x3d + width3d, y3d, depth, height3d);
          ctx.fillRect(x3d, y3d + height3d, width3d + depth, depth);
      }

      // Highlight selected component
      if (selectedComponent === component.id) {
        ctx.strokeStyle = 'hsl(var(--primary))';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(x3d - 2, y3d - 2, width3d + 4, height3d + 4);
        ctx.setLineDash([]);
      }

      // Draw thrust effect for engines during simulation
      if (component.type === 'engine' && isSimulating) {
        const thrustGradient = ctx.createRadialGradient(
          x3d + width3d/2, y3d + height3d, 0,
          x3d + width3d/2, y3d + height3d + 30, 15
        );
        thrustGradient.addColorStop(0, 'rgba(255, 100, 0, 0.8)');
        thrustGradient.addColorStop(0.5, 'rgba(255, 200, 0, 0.6)');
        thrustGradient.addColorStop(1, 'rgba(255, 255, 100, 0.2)');
        
        ctx.fillStyle = thrustGradient;
        ctx.fillRect(x3d + width3d/4, y3d + height3d, width3d/2, 30);
      }

      // Component label
      ctx.fillStyle = 'hsl(var(--foreground))';
      ctx.font = '12px sans-serif';
      ctx.fillText(component.name, x3d, y3d - 5);

      ctx.restore();
    });

    // Draw center of gravity indicator
    if (components.length > 0) {
      const cgY = centerY + (centerOfGravity - 200) * zoom * Math.cos(rotation.x * 0.01);
      ctx.fillStyle = 'hsl(var(--rocket-warning))';
      ctx.fillRect(centerX - 20, cgY - 2, 40, 4);
      ctx.fillStyle = 'hsl(var(--foreground))';
      ctx.font = '10px sans-serif';
      ctx.fillText('CG', centerX + 25, cgY + 3);
    }
  };

  const draw3DNoseCone = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    ctx.beginPath();
    ctx.moveTo(x + w/2, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
    ctx.fill();
  };

  const draw3DFins = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    // Draw multiple fins with 3D perspective
    const finCount = 3;
    for (let i = 0; i < finCount; i++) {
      const angle = (i * 120) + rotation.y;
      const finX = x + Math.cos(angle * Math.PI / 180) * 15;
      const finY = y + Math.sin(angle * Math.PI / 180) * 8;
      
      ctx.save();
      ctx.translate(finX + w/2, finY + h/2);
      ctx.rotate(angle * Math.PI / 180);
      ctx.fillRect(-w/6, -h/2, w/3, h);
      ctx.restore();
    }
  };

  const draw3DParachute = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    ctx.beginPath();
    ctx.arc(x + w/2, y + h/2, w/2, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw parachute lines
    ctx.strokeStyle = 'hsl(var(--foreground))';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const angle = (i * 45) * Math.PI / 180;
      ctx.beginPath();
      ctx.moveTo(x + w/2, y + h/2);
      ctx.lineTo(
        x + w/2 + Math.cos(angle) * w/2,
        y + h/2 + Math.sin(angle) * h/2
      );
      ctx.stroke();
    }
  };

  const getColorFromClass = (colorClass: string) => {
    // Extract colors from Tailwind classes or use defaults
    if (colorClass.includes('blue')) {
      return {
        light: '#93c5fd',
        base: '#3b82f6',
        dark: '#1d4ed8'
      };
    } else if (colorClass.includes('red')) {
      return {
        light: '#fca5a5',
        base: '#ef4444',
        dark: '#dc2626'
      };
    } else if (colorClass.includes('green')) {
      return {
        light: '#86efac',
        base: '#22c55e',
        dark: '#16a34a'
      };
    } else {
      return {
        light: '#d1d5db',
        base: '#6b7280',
        dark: '#374151'
      };
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMouse({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - lastMouse.x;
    const deltaY = e.clientY - lastMouse.y;

    setRotation(prev => ({
      x: prev.x + deltaY * 0.5,
      y: prev.y + deltaX * 0.5
    }));

    setLastMouse({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.3, Math.min(3, prev * zoomFactor)));
  };

  const resetView = () => {
    setRotation({ x: 0, y: 0 });
    setZoom(1);
  };

  const clearCanvas = () => {
    components.forEach(comp => onComponentDelete(comp.id));
    onComponentSelect(null);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold">3D Rocket View</h3>
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
            onClick={resetView}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Reset View
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

      {/* 3D Canvas */}
      <div 
        className="flex-1 relative bg-gradient-space overflow-hidden cursor-move"
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        />

        {/* Controls overlay */}
        <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3">
          <div className="text-xs space-y-1">
            <div className="flex items-center gap-2">
              <Move3D className="h-3 w-3" />
              <span>Drag to rotate</span>
            </div>
            <div>Scroll to zoom: {(zoom * 100).toFixed(0)}%</div>
            <div>Rotation: X{rotation.x.toFixed(0)}° Y{rotation.y.toFixed(0)}°</div>
          </div>
        </div>

        {/* Empty state */}
        {components.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Move3D className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">3D Rocket Designer</h3>
              <p className="text-sm">
                Drag components from the library to build in 3D
              </p>
              <p className="text-xs mt-2 opacity-70">
                Drag to rotate • Scroll to zoom
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};