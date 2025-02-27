
import { Button } from "@/components/ui/button";
import PricingCard from "@/components/PricingCard";
import { ArrowRight, Shield, LineChart, BellRing } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  
  const plans = [
    {
      title: "Basic",
      price: "Free",
      description: "Essential alerts for individual investors",
      features: [
        "Basic event notifications",
        "3 stocks in watchlist",
        "Daily market summary",
        "Email alerts",
      ],
    },
    {
      title: "Premium",
      price: "$25/mo",
      description: "Advanced insights for active traders",
      features: [
        "Real-time event notifications",
        "15 stocks in watchlist",
        "AI-powered stock analysis",
        "SMS & Email alerts",
        "Priority support",
      ],
      recommended: true,
    },
    {
      title: "Pro",
      price: "$99/mo",
      description: "Complete solution for professional traders",
      features: [
        "Instant event notifications",
        "Unlimited stocks in watchlist",
        "Advanced AI analytics",
        "Custom alert rules",
        "24/7 priority support",
        "API access",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative min-h-screen overflow-hidden">
        {/* Abstract animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-background to-purple-900">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.2)_0%,rgba(59,130,246,0)_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(147,51,234,0.2)_0%,rgba(147,51,234,0)_50%)]" />
          </div>
          
          {/* Animated lines */}
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            animation: 'moveBackground 30s linear infinite',
          }} />
        </div>

        {/* Content */}
        <div className="container relative px-4 pt-32 pb-20">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight text-foreground animate-slideUp">
              Stay Ahead of <span className="text-primary">Market-Moving Events</span>
            </h1>
            <p className="text-xl text-muted-foreground animate-slideUp [animation-delay:200ms]">
              Get real-time alerts and AI-powered insights on market-moving events. We cover your trading risks
              with advanced analysis and predictive alerts.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <Button 
                className="w-full sm:w-auto group bg-primary text-primary-foreground hover:bg-primary/90 animate-slideUp [animation-delay:400ms]" 
                size="lg"
                onClick={() => {
                  navigate("/auth");
                  localStorage.setItem("authMode", "signup");
                }}
              >
                Start Free Trial
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline"
                className="w-full sm:w-auto animate-slideUp [animation-delay:500ms]"
                size="lg"
                onClick={() => navigate("/features")}
              >
                View Features
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="bg-card py-20">
        <div className="container px-4">
          <h2 className="text-3xl font-bold text-center mb-16 text-foreground">
            Why Choose RippleEffect?
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="p-8 rounded-xl bg-secondary/50 backdrop-blur animate-slideUp hover:bg-secondary/70 transition-all duration-300 border border-white/5">
              <Shield className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-foreground">Protected Trading</h3>
              <p className="text-muted-foreground">
                Advanced risk analysis and real-time market monitoring to protect your investments.
              </p>
            </div>
            <div className="p-8 rounded-xl bg-secondary/50 backdrop-blur animate-slideUp [animation-delay:200ms] hover:bg-secondary/70 transition-all duration-300 border border-white/5">
              <LineChart className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-foreground">AI Analysis</h3>
              <p className="text-muted-foreground">
                Predictive AI algorithms analyze events and forecast potential market impact.
              </p>
            </div>
            <div className="p-8 rounded-xl bg-secondary/50 backdrop-blur animate-slideUp [animation-delay:400ms] hover:bg-secondary/70 transition-all duration-300 border border-white/5">
              <BellRing className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-foreground">Instant Alerts</h3>
              <p className="text-muted-foreground">
                Get actionable notifications based on real-time market analysis.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="container px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-16 text-foreground">
          Choose Your Plan
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <PricingCard key={index} {...plan} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
