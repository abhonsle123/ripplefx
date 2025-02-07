
import { Button } from "@/components/ui/button";
import PricingCard from "@/components/PricingCard";
import { ArrowRight } from "lucide-react";
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
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <div className="container px-4 pt-32 pb-20">
        <div className="text-center max-w-3xl mx-auto animate-fadeIn">
          <h1 className="text-5xl font-bold mb-6 tracking-tight">
            Stay Ahead of Market-Moving Events
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Real-time alerts and AI-powered analysis of global events that impact
            your investments. Never miss a market-moving moment.
          </p>
          <Button 
            className="group" 
            size="lg"
            onClick={() => {
              navigate("/auth");
              localStorage.setItem("authMode", "signup");
            }}
          >
            Get Started
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="bg-secondary py-20">
        <div className="container px-4">
          <h2 className="text-3xl font-bold text-center mb-16">
            Why Choose RippleEffect?
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="p-6 rounded-xl bg-accent animate-slideUp">
              <h3 className="text-xl font-semibold mb-3">Real-Time Alerts</h3>
              <p className="text-muted-foreground">
                Instant notifications about market-moving global events via SMS and
                email.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-accent animate-slideUp delay-100">
              <h3 className="text-xl font-semibold mb-3">AI Analysis</h3>
              <p className="text-muted-foreground">
                Advanced AI algorithms analyze events and predict potential market
                impact.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-accent animate-slideUp delay-200">
              <h3 className="text-xl font-semibold mb-3">Smart Insights</h3>
              <p className="text-muted-foreground">
                Get actionable recommendations based on real-time market analysis.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="container px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-16">
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
