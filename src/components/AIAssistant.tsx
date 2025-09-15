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
  MessageSquare
} from "lucide-react";
import type { RocketComponent } from "./RocketDesigner";

interface AIAssistantProps {
  components: RocketComponent[];
}

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const generateAIResponse = (components: RocketComponent[], userMessage: string): string => {
  const totalMass = components.reduce((sum, comp) => sum + comp.mass, 0);
  const hasNoseCone = components.some(c => c.type === 'nosecone');
  const hasEngine = components.some(c => c.type === 'engine');
  const hasFins = components.some(c => c.type === 'fins');
  const hasRecovery = components.some(c => c.type === 'parachute');

  // Simple rule-based responses
  if (userMessage.toLowerCase().includes('stability')) {
    if (!hasFins) {
      return "Your rocket needs fins for stability! Without fins, it will tumble during flight. Add at least 3-4 fins at the bottom of your rocket.";
    }
    return "Your rocket has good stability with the current fin configuration. Consider the fin size relative to the body tube for optimal performance.";
  }

  if (userMessage.toLowerCase().includes('altitude') || userMessage.toLowerCase().includes('height')) {
    if (!hasEngine) {
      return "You'll need to add an engine to achieve any altitude! Try adding a solid motor from the component library.";
    }
    return `With your current design (${totalMass.toFixed(2)}kg), you should reach approximately ${(300 - totalMass * 50).toFixed(0)}m altitude. Reduce mass or add more thrust for higher flights.`;
  }

  if (userMessage.toLowerCase().includes('safety') || userMessage.toLowerCase().includes('recovery')) {
    if (!hasRecovery) {
      return "⚠️ Safety first! Your rocket needs a recovery system. Add a parachute to ensure safe landing and rocket reusability.";
    }
    return "Great job including a recovery system! Make sure it's sized appropriately for your rocket's mass and descent rate.";
  }

  if (userMessage.toLowerCase().includes('design') || userMessage.toLowerCase().includes('build')) {
    const issues = [];
    if (!hasNoseCone) issues.push("nose cone");
    if (!hasEngine) issues.push("engine");
    if (!hasFins) issues.push("fins");
    
    if (issues.length > 0) {
      return `Your rocket design is missing: ${issues.join(', ')}. A complete rocket typically needs all these components for successful flight.`;
    }
    return "Your rocket design looks complete! You have all the essential components. Consider fine-tuning mass distribution for optimal performance.";
  }

  // Default responses
  const responses = [
    "I'm here to help you build the perfect rocket! Ask me about stability, performance, or design optimization.",
    "Great question! Based on your current design, I recommend focusing on the center of gravity and stability margin.",
    "Let's analyze your rocket together. What specific aspect would you like to improve?",
    "Rocket science is all about balance - between thrust and weight, stability and maneuverability. What's your priority?"
  ];

  return responses[Math.floor(Math.random() * responses.length)];
};

export const AIAssistant = ({ components }: AIAssistantProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      type: "assistant",
      content: "Hello! I'm your AI rocketry co-pilot. I can help you optimize your rocket design for maximum performance and safety. What would you like to know?",
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
        content: generateAIResponse(components, inputValue),
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
        message: "Add fins for stability"
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