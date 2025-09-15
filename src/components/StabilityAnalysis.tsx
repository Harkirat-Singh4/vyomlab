import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Wind,
  Crosshair,
  RotateCcw,
  Activity
} from "lucide-react";
import type { RocketComponent } from "./RocketDesigner";

interface StabilityAnalysisProps {
  components: RocketComponent[];
  selectedMotor: any;
}

interface StabilityMetrics {
  staticMargin: number;
  dynamicStability: number;
  centerOfGravity: number;
  centerOfPressure: number;
  finEffectiveness: number;
  recoveryStability: number;
  overallRating: number;
  recommendations: string[];
  warnings: string[];
}

export const StabilityAnalysis = ({ components, selectedMotor }: StabilityAnalysisProps) => {
  const [metrics, setMetrics] = useState<StabilityMetrics | null>(null);
  const [analysisPhase, setAnalysisPhase] = useState<"powered" | "coast" | "recovery">("powered");

  useEffect(() => {
    calculateStabilityMetrics();
  }, [components, selectedMotor, analysisPhase]);

  const calculateStabilityMetrics = () => {
    if (components.length === 0) {
      setMetrics(null);
      return;
    }

    // Calculate rocket geometry
    const rocketLength = Math.max(...components.map(c => c.y + c.height)) - Math.min(...components.map(c => c.y));
    const rocketDiameter = Math.max(...components.map(c => c.width));
    
    // Calculate Center of Gravity
    const totalMass = components.reduce((sum, comp) => {
      let mass = comp.mass;
      // Adjust for motor propellant mass during different phases
      if (comp.type === 'engine' && selectedMotor) {
        switch (analysisPhase) {
          case 'powered':
            mass += selectedMotor.propellantMass / 2; // Half burned
            break;
          case 'coast':
            mass += 0; // No propellant
            break;
          case 'recovery':
            mass += 0; // No propellant
            break;
        }
      }
      return sum + mass;
    }, 0);

    const cg = totalMass > 0 
      ? components.reduce((sum, comp) => {
          let mass = comp.mass;
          if (comp.type === 'engine' && selectedMotor) {
            switch (analysisPhase) {
              case 'powered': mass += selectedMotor.propellantMass / 2; break;
              case 'coast': mass += 0; break;
              case 'recovery': mass += 0; break;
            }
          }
          return sum + (comp.y + comp.height / 2) * mass;
        }, 0) / totalMass
      : 0;

    // Calculate Center of Pressure using Barrowman equations (simplified)
    let cpNumerator = 0;
    let cpDenominator = 0;

    components.forEach(comp => {
      let contribution = 0;
      let normalForceDerivative = 0;

      switch (comp.type) {
        case 'nosecone':
          // Nose cone contribution (simplified conical nose)
          normalForceDerivative = 2 * Math.PI * Math.pow(comp.width / 2, 2);
          contribution = comp.y + (2/3) * comp.height;
          break;
          
        case 'bodytube':
          // Body tube has minimal contribution to CP
          normalForceDerivative = 0.1 * comp.width * comp.height;
          contribution = comp.y + comp.height / 2;
          break;
          
        case 'fins':
          // Fin contribution (major factor)
          const finArea = comp.width * comp.height;
          const aspectRatio = Math.pow(comp.height, 2) / finArea;
          normalForceDerivative = (1 + 1 / aspectRatio) * finArea * 4; // Assuming 4 fins
          contribution = comp.y + comp.height / 3; // CP at 1/3 chord for triangular fin
          break;
          
        case 'transition':
          // Transition section
          normalForceDerivative = Math.PI * comp.width * comp.height * 0.5;
          contribution = comp.y + comp.height / 2;
          break;
      }

      cpNumerator += contribution * normalForceDerivative;
      cpDenominator += normalForceDerivative;
    });

    const cp = cpDenominator > 0 ? cpNumerator / cpDenominator : 0;

    // Calculate static margin (in calibers)
    const staticMargin = (cp - cg) / (rocketDiameter || 1);
    
    // Calculate fin effectiveness
    const fins = components.filter(c => c.type === 'fins');
    const finEffectiveness = fins.length > 0 
      ? Math.min(100, (fins.length * 25) + (fins[0]?.height || 0) / rocketLength * 50)
      : 0;

    // Dynamic stability calculation (simplified)
    const dynamicStability = Math.min(100, staticMargin * 20 + finEffectiveness * 0.3);

    // Recovery stability
    const hasRecovery = components.some(c => c.type === 'parachute');
    const recoveryStability = hasRecovery ? 85 + Math.random() * 10 : 20;

    // Overall rating
    const overallRating = (staticMargin > 1 && staticMargin < 3) ? 
      Math.min(100, (staticMargin * 30) + (finEffectiveness * 0.5) + (hasRecovery ? 20 : 0)) :
      Math.max(0, 50 - Math.abs(staticMargin - 2) * 25);

    // Generate recommendations and warnings
    const recommendations: string[] = [];
    const warnings: string[] = [];

    if (staticMargin < 1) {
      warnings.push("Static margin too low - rocket may be unstable");
      recommendations.push("Move center of gravity forward or add more fin area");
    } else if (staticMargin > 3) {
      warnings.push("Static margin too high - rocket may be overstable");
      recommendations.push("Reduce fin size or move weight aft");
    }

    if (fins.length === 0) {
      warnings.push("No fins detected - rocket will be unstable");
      recommendations.push("Add fin set for stability");
    } else if (fins.length < 3) {
      warnings.push("Insufficient fin count for optimal stability");
      recommendations.push("Use at least 3 fins for best stability");
    }

    if (!hasRecovery) {
      warnings.push("No recovery system detected");
      recommendations.push("Add parachute or streamer for safe recovery");
    }

    if (components.filter(c => c.type === 'engine').length === 0) {
      warnings.push("No propulsion system detected");
      recommendations.push("Add a motor for powered flight");
    }

    if (staticMargin >= 1 && staticMargin <= 3 && fins.length >= 3 && hasRecovery) {
      recommendations.push("Excellent stability configuration!");
    }

    setMetrics({
      staticMargin,
      dynamicStability,
      centerOfGravity: cg,
      centerOfPressure: cp,
      finEffectiveness,
      recoveryStability,
      overallRating,
      recommendations,
      warnings
    });
  };

  if (!metrics) {
    return (
      <Card className="h-full cosmic-border flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Components</h3>
          <p className="text-sm">Add components to analyze stability</p>
        </div>
      </Card>
    );
  }

  const getStabilityColor = (value: number) => {
    if (value >= 80) return "text-rocket-success";
    if (value >= 60) return "text-rocket-warning";
    return "text-destructive";
  };

  const getStaticMarginStatus = () => {
    if (metrics.staticMargin < 1) return { color: "destructive", text: "Unstable" };
    if (metrics.staticMargin > 3) return { color: "warning", text: "Overstable" };
    return { color: "success", text: "Stable" };
  };

  const marginStatus = getStaticMarginStatus();

  return (
    <Card className="h-full cosmic-border">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Stability Analysis</h3>
          <Badge 
            variant="outline" 
            className={getStabilityColor(metrics.overallRating)}
          >
            {metrics.overallRating.toFixed(0)}%
          </Badge>
        </div>

        {/* Flight Phase Selector */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {[
            { key: "powered", label: "Powered", icon: Activity },
            { key: "coast", label: "Coast", icon: TrendingUp },
            { key: "recovery", label: "Recovery", icon: RotateCcw }
          ].map(phase => (
            <button
              key={phase.key}
              onClick={() => setAnalysisPhase(phase.key as any)}
              className={`flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded text-sm transition-colors ${
                analysisPhase === phase.key 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-accent'
              }`}
            >
              <phase.icon className="h-3 w-3" />
              {phase.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto">
        {/* Static Margin */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium flex items-center gap-1">
              <Crosshair className="h-4 w-4" />
              Static Margin
            </span>
            <Badge 
              variant="outline"
              className={marginStatus.color === 'success' ? 'text-rocket-success' : 
                        marginStatus.color === 'warning' ? 'text-rocket-warning' : 'text-destructive'}
            >
              {metrics.staticMargin.toFixed(2)} cal
            </Badge>
          </div>
          <Progress 
            value={Math.min(100, Math.max(0, (metrics.staticMargin / 3) * 100))} 
            className="h-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Optimal range: 1.0 - 3.0 calibers
          </p>
        </div>

        {/* Fin Effectiveness */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium flex items-center gap-1">
              <Wind className="h-4 w-4" />
              Fin Effectiveness
            </span>
            <Badge variant="outline">
              {metrics.finEffectiveness.toFixed(0)}%
            </Badge>
          </div>
          <Progress value={metrics.finEffectiveness} className="h-2" />
        </div>

        {/* Center of Gravity vs Center of Pressure */}
        <div className="bg-muted/50 p-3 rounded-lg">
          <h4 className="font-medium mb-2">CG/CP Analysis</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Center of Gravity:</span>
              <span className="font-medium">{metrics.centerOfGravity.toFixed(1)} mm</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Center of Pressure:</span>
              <span className="font-medium">{metrics.centerOfPressure.toFixed(1)} mm</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">CP-CG Distance:</span>
              <span className="font-medium">{(metrics.centerOfPressure - metrics.centerOfGravity).toFixed(1)} mm</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Warnings */}
        {metrics.warnings.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-1 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Stability Warnings
            </h4>
            {metrics.warnings.map((warning, index) => (
              <Alert key={index} variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">{warning}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Recommendations */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-1 text-primary">
            <CheckCircle className="h-4 w-4" />
            Recommendations
          </h4>
          <div className="space-y-1">
            {metrics.recommendations.map((rec, index) => (
              <div key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                <div className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0" />
                {rec}
              </div>
            ))}
          </div>
        </div>

        {/* Overall Rating */}
        <div className="bg-muted/50 p-3 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">Overall Stability Rating</h4>
            <Badge 
              variant="outline"
              className={getStabilityColor(metrics.overallRating)}
            >
              {metrics.overallRating >= 80 ? "Excellent" :
               metrics.overallRating >= 60 ? "Good" :
               metrics.overallRating >= 40 ? "Fair" : "Poor"}
            </Badge>
          </div>
          <Progress 
            value={metrics.overallRating} 
            className="h-3"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Based on static margin, fin design, and recovery system
          </p>
        </div>
      </div>
    </Card>
  );
};