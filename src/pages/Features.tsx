
import { Bell, ChartLine, Brain } from "lucide-react";

const Features = () => {
  return (
    <div className="min-h-screen bg-background text-foreground pt-32">
      <div className="container px-4">
        <h1 className="text-4xl font-bold text-center mb-16 animate-fadeIn">
          Our Features
        </h1>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="p-8 rounded-xl bg-accent animate-slideUp">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
              <Bell className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-4">Real-Time Event Alerts</h3>
            <p className="text-muted-foreground">
              Get instant notifications about market-moving events as they happen.
              Stay informed and never miss crucial opportunities.
            </p>
          </div>
          <div className="p-8 rounded-xl bg-accent animate-slideUp delay-100">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
              <ChartLine className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-4">
              Stock Impact Predictions
            </h3>
            <p className="text-muted-foreground">
              Leverage our AI-powered analysis to understand how events will impact
              stock prices and market movements.
            </p>
          </div>
          <div className="p-8 rounded-xl bg-accent animate-slideUp delay-200">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-4">
              AI Investor Tool (Beta)
            </h3>
            <p className="text-muted-foreground">
              Access cutting-edge AI algorithms that help you make data-driven
              investment decisions with confidence.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Features;
