
import { Shield, LineChart, BellRing } from "lucide-react";

const FeatureGrid = () => {
  return (
    <div className="bg-card py-20">
      <div className="container px-4">
        <h2 className="text-3xl font-bold text-center mb-16 text-foreground">
          Why Choose RippleEffect?
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="p-8 rounded-xl bg-secondary/50 backdrop-blur animate-slideUp hover:bg-secondary/70 transition-all duration-300 border border-white/5 hover:translate-y-[-4px]">
            <Shield className="w-12 h-12 text-primary mb-4 animate-floating" />
            <h3 className="text-xl font-semibold mb-3 text-foreground">Protected Trading</h3>
            <p className="text-muted-foreground">
              Advanced risk analysis and real-time market monitoring to protect your investments.
            </p>
          </div>
          <div className="p-8 rounded-xl bg-secondary/50 backdrop-blur animate-slideUp [animation-delay:200ms] hover:bg-secondary/70 transition-all duration-300 border border-white/5 hover:translate-y-[-4px]">
            <LineChart className="w-12 h-12 text-primary mb-4 animate-floating [animation-delay:200ms]" />
            <h3 className="text-xl font-semibold mb-3 text-foreground">AI Analysis</h3>
            <p className="text-muted-foreground">
              Predictive AI algorithms analyze events and forecast potential market impact.
            </p>
          </div>
          <div className="p-8 rounded-xl bg-secondary/50 backdrop-blur animate-slideUp [animation-delay:400ms] hover:bg-secondary/70 transition-all duration-300 border border-white/5 hover:translate-y-[-4px]">
            <BellRing className="w-12 h-12 text-primary mb-4 animate-floating [animation-delay:400ms]" />
            <h3 className="text-xl font-semibold mb-3 text-foreground">Instant Alerts</h3>
            <p className="text-muted-foreground">
              Get actionable notifications based on real-time market analysis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureGrid;
