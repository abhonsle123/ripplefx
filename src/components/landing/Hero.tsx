
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen">
      {/* Modern gradient background with improved animation */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-background to-purple-900/30 animate-gradientShift" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1)_0%,transparent_50%)] animate-shimmer" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(59,130,246,0.1)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
      </div>

      <div className="container relative px-4 pt-32 pb-20">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight text-foreground animate-slideUp">
            Stay Ahead of <span className="text-primary relative inline-block">
              <span className="relative z-10">Market-Moving Events</span>
              <span className="absolute bottom-0 left-0 w-full h-2 bg-primary/20 rounded-full transform -translate-y-1"></span>
            </span>
          </h1>
          <p className="text-xl text-muted-foreground animate-slideUp [animation-delay:200ms]">
            Get real-time alerts and AI-powered insights on market-moving events. We cover your trading risks
            with advanced analysis and predictive alerts.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Button 
              className="w-full sm:w-auto group bg-primary text-primary-foreground hover:bg-primary/90 animate-slideUp [animation-delay:400ms] transition-all duration-300 hover:translate-y-[-2px] hover:shadow-md" 
              size="lg"
              onClick={() => {
                navigate("/auth");
                localStorage.setItem("authMode", "signup");
              }}
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
            <Button 
              variant="outline"
              className="w-full sm:w-auto animate-slideUp [animation-delay:500ms] transition-all duration-300 hover:translate-y-[-2px] hover:bg-secondary/60"
              size="lg"
              onClick={() => navigate("/features")}
            >
              View Features
            </Button>
          </div>
        </div>
      </div>
      
      {/* Elegant curved shape divider with gradient */}
      <div className="absolute bottom-0 left-0 w-full h-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background"></div>
        <div className="absolute bottom-0 w-full h-16 bg-background rounded-t-[50%] transform scale-x-150"></div>
      </div>
    </div>
  );
};

export default Hero;
