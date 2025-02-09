
import { Bell, ChartLine, Brain, Zap, Target, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Features = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background/90">
      <div className="container px-4 pt-32">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-4 animate-fadeIn">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Powerful Features
            </h1>
            <p className="text-xl text-muted-foreground">
              Everything you need to make informed investment decisions
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
            {[
              {
                icon: Bell,
                title: "Real-Time Event Alerts",
                description: "Get instant notifications about market-moving events as they happen. Stay informed and never miss crucial opportunities.",
              },
              {
                icon: ChartLine,
                title: "Stock Impact Predictions",
                description: "Leverage our AI-powered analysis to understand how events will impact stock prices and market movements.",
              },
              {
                icon: Brain,
                title: "AI Market Analysis",
                description: "Access cutting-edge AI algorithms that help you make data-driven investment decisions with confidence.",
              },
              {
                icon: Zap,
                title: "Smart Notifications",
                description: "Customize your alert preferences to receive only the most relevant updates for your investment strategy.",
              },
              {
                icon: Target,
                title: "Sector Tracking",
                description: "Monitor specific industries and sectors with detailed impact analysis and performance metrics.",
              },
              {
                icon: Shield,
                title: "Risk Assessment",
                description: "Evaluate potential risks and opportunities with our comprehensive market analysis tools.",
              },
            ].map((feature, index) => (
              <div
                key={feature.title}
                className="p-6 rounded-xl bg-card/40 backdrop-blur-sm border border-accent/10 hover:scale-[1.02] transition-all duration-300 animate-slideUp"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center animate-slideUp [animation-delay:600ms]">
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 group"
              onClick={() => navigate("/auth")}
            >
              Get Started
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Features;
