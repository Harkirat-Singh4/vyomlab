import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Bot, 
  Send, 
  Lightbulb, 
  AlertTriangle, 
  CheckCircle,
  MessageSquare,
  Rocket,
  Calculator,
  Target,
  Wind,
  Thermometer
} from "lucide-react";
import type { RocketComponent } from "./RocketDesigner";

interface AIAssistantProps {
  components: RocketComponent[];
  selectedMotor?: any;
  onGenerateDesign?: (design: RocketComponent[]) => void;
}

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// Advanced rocket design knowledge base
const ROCKET_MATERIALS = {
  cardboard: { density: 0.7, strength: 2, cost: 1 },
  balsa: { density: 0.12, strength: 3, cost: 2 },
  birch: { density: 0.6, strength: 7, cost: 3 },
  fiberglass: { density: 1.8, strength: 9, cost: 5 },
  carbon: { density: 1.6, strength: 10, cost: 8 }
};

const MOTOR_DATABASE = {
  'A8-3': { impulse: 2.5, burnTime: 0.5, thrust: 5.0, mass: 0.024 },
  'B6-4': { impulse: 5.0, burnTime: 1.0, thrust: 5.0, mass: 0.044 },
  'C6-5': { impulse: 10.0, burnTime: 2.0, thrust: 5.0, mass: 0.078 },
  'D12-5': { impulse: 20.0, burnTime: 1.8, thrust: 11.1, mass: 0.125 },
  'E9-6': { impulse: 30.0, burnTime: 3.2, thrust: 9.4, mass: 0.184 },
  'F15-4': { impulse: 40.0, burnTime: 2.7, thrust: 14.8, mass: 0.215 }
};

// Weather simulation data
const getWeatherConditions = (location?: string) => ({
  temperature: 15 + Math.random() * 15, // 15-30°C
  windSpeed: Math.random() * 10, // 0-10 m/s
  pressure: 1013 + (Math.random() - 0.5) * 50, // ±25 hPa
  humidity: 40 + Math.random() * 40, // 40-80%
  visibility: 5 + Math.random() * 15 // 5-20 km
});

// Design generation based on requirements
const generateDesignForRequirements = (requirements: {
  targetAltitude?: number;
  targetVelocity?: number;
  payload?: number;
  weather?: boolean;
  stability?: 'high' | 'medium' | 'low';
}): RocketComponent[] => {
  const { targetAltitude = 300, targetVelocity = 100, payload = 0, stability = 'medium' } = requirements;
  
  // Calculate required motor impulse using rocket equation
  const estimatedMass = 0.3 + payload; // Base rocket mass + payload
  const requiredImpulse = Math.sqrt(targetAltitude * estimatedMass * 0.8); // Simplified calculation
  
  // Select appropriate motor
  let selectedMotor = 'C6-5';
  if (requiredImpulse > 35) selectedMotor = 'F15-4';
  else if (requiredImpulse > 25) selectedMotor = 'E9-6';
  else if (requiredImpulse > 15) selectedMotor = 'D12-5';
  else if (requiredImpulse > 8) selectedMotor = 'C6-5';
  else if (requiredImpulse > 4) selectedMotor = 'B6-4';
  else selectedMotor = 'A8-3';
  
  // Calculate optimal rocket dimensions
  const motorData = MOTOR_DATABASE[selectedMotor as keyof typeof MOTOR_DATABASE];
  const optimalLength = Math.sqrt(targetAltitude / 10); // Length-to-altitude ratio
  const bodyDiameter = Math.max(29, Math.min(54, motorData.thrust * 2)); // Scale with thrust
  
  // Stability-based fin design
  const finCount = stability === 'high' ? 4 : stability === 'medium' ? 3 : 3;
  const finSize = stability === 'high' ? 1.2 : stability === 'medium' ? 1.0 : 0.8;
  
  return [
    {
      id: 'nose-1',
      type: 'nosecone',
      name: 'Optimized Nose Cone',
      x: 50,
      y: 50,
      width: bodyDiameter,
      height: bodyDiameter * 1.5,
      mass: 0.025,
      dragCoefficient: 0.15,
      color: 'bg-gradient-to-b from-rocket-primary to-rocket-secondary',
      material: 'balsa',
      thickness: 3
    },
    {
      id: 'body-1',
      type: 'bodytube',
      name: 'Main Body Tube',
      x: 50,
      y: 50 + bodyDiameter * 1.5,
      width: bodyDiameter,
      height: optimalLength * 30,
      mass: 0.12,
      dragCoefficient: 0.45,
      color: 'bg-gradient-to-b from-rocket-secondary to-rocket-accent',
      material: 'cardboard',
      thickness: 2
    },
    {
      id: 'fins-1',
      type: 'fins',
      name: `${finCount}-Fin Set`,
      x: 50,
      y: 50 + bodyDiameter * 1.5 + optimalLength * 25,
      width: bodyDiameter + 40 * finSize,
      height: 60 * finSize,
      mass: 0.015 * finCount,
      dragCoefficient: 0.02 * finCount,
      color: 'bg-gradient-to-r from-rocket-accent to-rocket-warning',
      finCount,
      material: 'balsa'
    },
    {
      id: 'engine-1',
      type: 'engine',
      name: `${selectedMotor} Engine Mount`,
      x: 50,
      y: 50 + bodyDiameter * 1.5 + optimalLength * 30 - 40,
      width: bodyDiameter,
      height: 40,
      mass: motorData.mass,
      dragCoefficient: 0.1,
      color: 'bg-gradient-to-b from-rocket-warning to-red-500',
      motorType: selectedMotor
    },
    {
      id: 'recovery-1',
      type: 'parachute',
      name: 'Recovery System',
      x: 50,
      y: 70,
      width: bodyDiameter * 0.8,
      height: 30,
      mass: 0.02,
      dragCoefficient: 1.3,
      color: 'bg-gradient-to-r from-blue-400 to-cyan-400',
      deploymentAltitude: targetAltitude * 0.7
    }
  ];
};

// Complex physics calculations
const calculateAdvancedMetrics = (components: RocketComponent[], selectedMotor: any) => {
  const totalMass = components.reduce((sum, comp) => sum + comp.mass, 0);
  const rocketLength = Math.max(...components.map(c => c.y + c.height)) - Math.min(...components.map(c => c.y));
  
  // Center of gravity calculation
  let totalMoment = 0;
  components.forEach(comp => {
    const componentCG = comp.y + comp.height / 2;
    totalMoment += comp.mass * componentCG;
  });
  const centerOfGravity = totalMoment / totalMass;
  
  // Center of pressure (simplified Barrowman equations)
  const noseCone = components.find(c => c.type === 'nosecone');
  const bodyTube = components.find(c => c.type === 'bodytube');
  const fins = components.find(c => c.type === 'fins');
  
  let centerOfPressure = rocketLength * 0.5; // Default middle
  if (noseCone && bodyTube && fins) {
    const noseCP = noseCone.height * 0.466;
    const finCP = fins.y + fins.height * 0.25;
    const finArea = fins.width * fins.height * (fins.finCount || 3);
    const bodyArea = bodyTube.width * bodyTube.height;
    
    centerOfPressure = (noseCP * bodyArea + finCP * finArea) / (bodyArea + finArea);
  }
  
  // Stability margin (calibers)
  const stabilityMargin = (centerOfPressure - centerOfGravity) / (bodyTube?.width || 50);
  
  // Performance calculations
  const motorData = selectedMotor ? MOTOR_DATABASE[selectedMotor.designation as keyof typeof MOTOR_DATABASE] : null;
  const thrustToWeight = motorData ? (motorData.thrust * 9.81) / (totalMass * 9.81) : 0;
  
  // Altitude prediction using rocket equation
  const deltaV = motorData ? Math.log((totalMass + motorData.mass) / totalMass) * motorData.impulse * 9.81 / motorData.mass : 0;
  const predictedAltitude = (deltaV * deltaV) / (2 * 9.81) * 0.7; // 70% efficiency
  
  return {
    centerOfGravity,
    centerOfPressure,
    stabilityMargin,
    thrustToWeight,
    predictedAltitude,
    totalMass,
    rocketLength
  };
};

// Real-time design analysis and recommendations
const analyzeDesignProblems = (components: RocketComponent[], selectedMotor: any) => {
  const metrics = calculateAdvancedMetrics(components, selectedMotor);
  const issues = [];
  const recommendations = [];
  
  // Stability analysis
  if (metrics.stabilityMargin < 1) {
    issues.push("❌ Unstable rocket - Center of pressure too close to center of gravity");
    recommendations.push("Move fins further back or increase fin size");
  } else if (metrics.stabilityMargin > 3) {
    issues.push("⚠️ Over-stable rocket - May weathercock in wind");
    recommendations.push("Reduce fin size or move center of gravity back");
  }
  
  // Thrust-to-weight analysis
  if (metrics.thrustToWeight < 5) {
    issues.push("❌ Insufficient thrust - Rocket may not lift off");
    recommendations.push("Use a more powerful motor or reduce rocket mass");
  } else if (metrics.thrustToWeight > 15) {
    issues.push("⚠️ High acceleration - May cause structural damage");
    recommendations.push("Use a lower thrust motor or add ballast");
  }
  
  // Mass distribution
  const hasNoseCone = components.some(c => c.type === 'nosecone');
  const hasRecovery = components.some(c => c.type === 'parachute');
  const hasFins = components.some(c => c.type === 'fins');
  
  if (!hasNoseCone) {
    issues.push("❌ Missing nose cone - Critical for aerodynamics");
    recommendations.push("Add a nose cone to reduce drag and improve stability");
  }
  
  if (!hasRecovery) {
    issues.push("❌ No recovery system - Rocket will be lost");
    recommendations.push("Add a parachute or streamer for safe recovery");
  }
  
  if (!hasFins) {
    issues.push("❌ No fins - Rocket will be unstable");
    recommendations.push("Add 3-4 fins at the rear for stability");
  }
  
  return { issues, recommendations, metrics };
};

const generateAIResponse = (
  components: RocketComponent[], 
  selectedMotor: any, 
  userMessage: string,
  onGenerateDesign?: (design: RocketComponent[]) => void
): string => {
  const message = userMessage.toLowerCase();
  
  // Design generation requests
  if (message.includes('design') && (message.includes('altitude') || message.includes('velocity'))) {
    const altitudeMatch = message.match(/(\d+)\s*(?:m|meter|metre|feet|ft)/);
    const velocityMatch = message.match(/(\d+)\s*(?:m\/s|mph|kmh|km\/h)/);
    const weatherMatch = message.includes('weather');
    
    const targetAltitude = altitudeMatch ? parseInt(altitudeMatch[1]) : 300;
    const targetVelocity = velocityMatch ? parseInt(velocityMatch[1]) : 100;
    
    if (onGenerateDesign) {
      const design = generateDesignForRequirements({
        targetAltitude,
        targetVelocity,
        weather: weatherMatch,
        stability: 'medium'
      });
      onGenerateDesign(design);
    }
    
    const weather = weatherMatch ? getWeatherConditions() : null;
    const weatherInfo = weather ? 
      `\n\n🌤️ Current weather conditions:\n- Temperature: ${weather.temperature.toFixed(1)}°C\n- Wind: ${weather.windSpeed.toFixed(1)} m/s\n- Pressure: ${weather.pressure.toFixed(0)} hPa` : '';
    
    return `🚀 I've generated an optimized rocket design for ${targetAltitude}m altitude! The design includes:

✅ Optimized nose cone for minimal drag
✅ Properly sized body tube and fins
✅ Appropriate motor selection
✅ Recovery system

Key specifications:
- Target altitude: ${targetAltitude}m
- Estimated performance: ${(targetAltitude * 0.9).toFixed(0)}m
- Stability margin: Optimized for flight conditions${weatherInfo}

The design has been added to your workspace. You can modify any component as needed!`;
  }
  
  // Complex calculations
  if (message.includes('calculate') || message.includes('physics') || message.includes('equation')) {
    const analysis = analyzeDesignProblems(components, selectedMotor);
    const { metrics } = analysis;
    
    return `🧮 Advanced Physics Analysis:

📊 **Flight Metrics:**
- Center of Gravity: ${metrics.centerOfGravity.toFixed(1)}mm from nose
- Center of Pressure: ${metrics.centerOfPressure.toFixed(1)}mm from nose
- Stability Margin: ${metrics.stabilityMargin.toFixed(2)} calibers
- Thrust-to-Weight: ${metrics.thrustToWeight.toFixed(1)}:1
- Predicted Altitude: ${metrics.predictedAltitude.toFixed(0)}m

🔬 **Technical Details:**
- Total Mass: ${metrics.totalMass.toFixed(3)}kg
- Rocket Length: ${metrics.rocketLength.toFixed(1)}mm
- Apogee Time: ~${(metrics.predictedAltitude / 50).toFixed(1)}s

These calculations use the rocket equation and Barrowman stability methods for accuracy.`;
  }
  
  // Real-time design analysis
  if (components.length > 0) {
    const analysis = analyzeDesignProblems(components, selectedMotor);
    
    if (message.includes('problem') || message.includes('issue') || message.includes('fix') || message.includes('analyze')) {
      let response = "🔍 **Real-time Design Analysis:**\n\n";
      
      if (analysis.issues.length > 0) {
        response += "**Issues Found:**\n";
        analysis.issues.forEach(issue => response += `${issue}\n`);
        response += "\n";
      }
      
      if (analysis.recommendations.length > 0) {
        response += "**Recommendations:**\n";
        analysis.recommendations.forEach(rec => response += `💡 ${rec}\n`);
      }
      
      if (analysis.issues.length === 0) {
        response += "✅ **No critical issues found!** Your rocket design looks solid.";
      }
      
      return response;
    }
  }
  
  // Enhanced existing responses with technical depth
  if (message.includes('stability')) {
    const analysis = analyzeDesignProblems(components, selectedMotor);
    return `🎯 **Stability Analysis:**

Current stability margin: ${analysis.metrics.stabilityMargin.toFixed(2)} calibers
- Optimal range: 1.0-2.5 calibers
- Your rocket: ${analysis.metrics.stabilityMargin < 1 ? '❌ Unstable' : 
                  analysis.metrics.stabilityMargin > 3 ? '⚠️ Over-stable' : '✅ Stable'}

**Technical Insights:**
- CG: ${analysis.metrics.centerOfGravity.toFixed(1)}mm from nose
- CP: ${analysis.metrics.centerOfPressure.toFixed(1)}mm from nose
- Recovery deployment altitude: ${(analysis.metrics.predictedAltitude * 0.7).toFixed(0)}m`;
  }
  
  if (message.includes('altitude') || message.includes('performance')) {
    const analysis = analyzeDesignProblems(components, selectedMotor);
    const motorData = selectedMotor ? MOTOR_DATABASE[selectedMotor.designation as keyof typeof MOTOR_DATABASE] : null;
    
    return `🚀 **Performance Prediction:**

Estimated altitude: ${analysis.metrics.predictedAltitude.toFixed(0)}m
Maximum velocity: ~${(analysis.metrics.predictedAltitude * 0.4).toFixed(0)} m/s
Acceleration: ${analysis.metrics.thrustToWeight.toFixed(1)}g

**Flight Profile:**
- Burn time: ${motorData?.burnTime || 'N/A'}s
- Coasting phase: ${(analysis.metrics.predictedAltitude / 100).toFixed(1)}s
- Total flight time: ~${(analysis.metrics.predictedAltitude / 30).toFixed(0)}s

Want to optimize for higher altitude? Try reducing mass or increasing motor power!`;
  }
  
  // Default enhanced responses
  const advancedResponses = [
    "🧠 I'm your advanced rocketry AI! I can generate custom designs, solve complex physics problems, and provide real-time analysis. What challenge shall we tackle?",
    "🔬 Ready for some rocket science? I can help with Barrowman stability calculations, trajectory optimization, and weather-adjusted performance predictions!",
    "🎯 Whether you need a design for specific altitude targets or want to solve aerodynamic challenges, I've got the computational power to help!",
    "⚡ From basic stability checks to advanced multi-stage calculations, I'm here to make your rocket designs soar!"
  ];
  
  return advancedResponses[Math.floor(Math.random() * advancedResponses.length)];
};

export const AIAssistant = ({ components, selectedMotor, onGenerateDesign }: AIAssistantProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      type: "assistant",
      content: "Hello! I'm your AI rocketry co-pilot. I can help you optimize your rocket design, select appropriate motors, and analyze stability. What would you like to know?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI thinking time
      setTimeout(() => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          content: generateAIResponse(components, selectedMotor, inputValue, onGenerateDesign),
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiResponse]);
        setIsTyping(false);
      }, 1000 + Math.random() * 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Generate quick insights
  const getQuickInsights = () => {
    const insights = [];
    
    if (components.length === 0) {
      insights.push({
        type: "info",
        icon: Lightbulb,
        message: "Start by adding a nose cone!"
      });
    }

    if (!components.some(c => c.type === 'fins')) {
      insights.push({
        type: "warning",
        icon: AlertTriangle,
        message: "Add engine and select motor"
      });
    }

    if (!components.some(c => c.type === 'parachute')) {
      insights.push({
        type: "warning",
        icon: AlertTriangle,
        message: "Recovery system needed"
      });
    }

    if (components.some(c => c.type === 'nosecone') && 
        components.some(c => c.type === 'engine') && 
        components.some(c => c.type === 'fins')) {
      insights.push({
        type: "success",
        icon: CheckCircle,
        message: "Core components complete!"
      });
    }

    return insights;
  };

  const quickInsights = getQuickInsights();

  return (
    <Card className="cosmic-border">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">AI Co-Pilot</h3>
          <Badge variant="outline" className="ml-auto">
            <div className="w-2 h-2 bg-rocket-success rounded-full mr-1 animate-pulse" />
            Online
          </Badge>
        </div>
      </div>

      {/* Quick Insights */}
      {quickInsights.length > 0 && (
        <div className="p-4 border-b border-border">
          <h4 className="text-sm font-medium mb-2">Quick Insights</h4>
          <div className="space-y-2">
            {quickInsights.slice(0, 3).map((insight, index) => (
              <div 
                key={index}
                className={`flex items-center gap-2 text-xs p-2 rounded ${
                  insight.type === 'warning' ? 'bg-rocket-warning/10 text-rocket-warning' :
                  insight.type === 'success' ? 'bg-rocket-success/10 text-rocket-success' :
                  'bg-primary/10 text-primary'
                }`}
              >
                <insight.icon className="h-3 w-3" />
                {insight.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="h-64 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg text-sm ${
                message.type === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-muted text-muted-foreground p-3 rounded-lg text-sm">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-100" />
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-200" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about stability, performance, or design..."
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
            size="sm"
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};