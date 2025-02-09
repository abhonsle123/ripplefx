
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const About = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background/90">
      <div className="container px-4 pt-32">
        <div className="max-w-3xl mx-auto text-center space-y-8 animate-fadeIn">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            About RippleEffect
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            RippleEffect's mission is to empower investors with actionable insights
            into global events that move markets. We combine cutting-edge AI
            technology with real-time data to ensure you never miss an opportunity
            to capitalize on market trends.
          </p>
          <div className="space-y-8 pt-4">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl bg-card/40 backdrop-blur-sm border border-accent/10 hover:scale-[1.02] transition-all duration-300">
                <h3 className="text-xl font-semibold text-primary mb-3">Real-Time Insights</h3>
                <p className="text-muted-foreground">
                  Get instant notifications about market-moving events as they happen, keeping you ahead of the curve.
                </p>
              </div>
              <div className="p-6 rounded-xl bg-card/40 backdrop-blur-sm border border-accent/10 hover:scale-[1.02] transition-all duration-300">
                <h3 className="text-xl font-semibold text-primary mb-3">AI-Powered Analysis</h3>
                <p className="text-muted-foreground">
                  Our advanced AI algorithms analyze events and predict potential market impacts with high accuracy.
                </p>
              </div>
              <div className="p-6 rounded-xl bg-card/40 backdrop-blur-sm border border-accent/10 hover:scale-[1.02] transition-all duration-300">
                <h3 className="text-xl font-semibold text-primary mb-3">Smart Alerts</h3>
                <p className="text-muted-foreground">
                  Customize your alert preferences and receive notifications that matter most to your investment strategy.
                </p>
              </div>
            </div>
            <Button 
              className="group bg-primary text-primary-foreground hover:bg-primary/90"
              size="lg"
              onClick={() => navigate("/auth")}
            >
              Start Your Journey
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
