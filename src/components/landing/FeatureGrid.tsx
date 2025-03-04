
import { Shield, LineChart, BellRing } from "lucide-react";

const FeatureGrid = () => {
  return (
    <div className="bg-card py-20">
      <div className="container px-4">
        <h2 className="text-3xl font-bold text-center mb-16 text-foreground">
          Why Choose <span className="text-primary relative">RippleEffect</span>
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="p-8 rounded-xl bg-secondary/50 backdrop-blur shadow-lg animate-slideUp hover:bg-secondary/70 transition-all duration-300 border border-white/5 hover:translate-y-[-8px] hover:shadow-xl">
            <div className="p-3 bg-primary/10 rounded-lg inline-flex mb-4 transition-transform">
              <Shield className="w-10 h-10 text-primary animate-floating" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">Protected Trading</h3>
            <p className="text-muted-foreground">
              Advanced risk analysis and real-time market monitoring to protect your investments.
            </p>
          </div>
          <div className="p-8 rounded-xl bg-secondary/50 backdrop-blur shadow-lg animate-slideUp [animation-delay:200ms] hover:bg-secondary/70 transition-all duration-300 border border-white/5 hover:translate-y-[-8px] hover:shadow-xl">
            <div className="p-3 bg-primary/10 rounded-lg inline-flex mb-4 transition-transform">
              <LineChart className="w-10 h-10 text-primary animate-floating [animation-delay:200ms]" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">AI Analysis</h3>
            <p className="text-muted-foreground">
              Predictive AI algorithms analyze events and forecast potential market impact.
            </p>
          </div>
          <div className="p-8 rounded-xl bg-secondary/50 backdrop-blur shadow-lg animate-slideUp [animation-delay:400ms] hover:bg-secondary/70 transition-all duration-300 border border-white/5 hover:translate-y-[-8px] hover:shadow-xl">
            <div className="p-3 bg-primary/10 rounded-lg inline-flex mb-4 transition-transform">
              <BellRing className="w-10 h-10 text-primary animate-floating [animation-delay:400ms]" />
            </div>
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
