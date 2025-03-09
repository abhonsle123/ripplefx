
import { ArrowDown, ArrowRight, BellRing, LineChart, Zap } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: <Zap className="w-12 h-12 text-primary" />,
      title: "Event Detection",
      description: "Our AI constantly scans news, social media, and financial data to detect market-moving events in real-time."
    },
    {
      icon: <LineChart className="w-12 h-12 text-primary" />,
      title: "Impact Analysis",
      description: "Advanced algorithms analyze potential market impact, considering historical patterns and current market conditions."
    },
    {
      icon: <BellRing className="w-12 h-12 text-primary" />,
      title: "Actionable Alerts",
      description: "Get personalized notifications with clear action items and confidence scores to help you make informed decisions."
    }
  ];

  return (
    <div className="bg-background py-24 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-2/3 h-32 bg-gradient-radial from-primary/10 to-transparent blur-2xl opacity-50"></div>
        <div className="absolute bottom-0 right-0 w-1/2 h-32 bg-gradient-radial from-primary/10 to-transparent blur-2xl opacity-50"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:40px_40px] opacity-10"></div>
      </div>

      <div className="container px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            How <span className="text-primary">RippleFX</span> Works
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our AI-powered platform helps you stay ahead of market movements with real-time analysis and alerts
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Process steps */}
          <div className="grid md:grid-cols-3 gap-6 md:gap-8 relative z-10">
            {steps.map((step, index) => (
              <div 
                key={index}
                className="bg-card/60 backdrop-blur-sm p-8 rounded-xl border border-white/5 flex flex-col items-center text-center hover:bg-card/80 transition-all duration-300 animate-slideUp hover:translate-y-[-8px]"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="p-4 rounded-full bg-primary/10 mb-6">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
                
                {index < steps.length - 1 && (
                  <div className="hidden md:flex absolute top-1/2 left-0 w-full transform -translate-y-1/2 justify-center pointer-events-none" 
                    style={{ left: `${(index + 0.5) * (100/3)}%` }}>
                    <ArrowRight className="w-6 h-6 text-primary/60" />
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Mobile arrow indicators */}
          <div className="md:hidden flex justify-center my-4">
            <ArrowDown className="w-6 h-6 text-primary/60 animate-floating" />
          </div>
        </div>

        {/* Call to action button */}
        <div className="text-center mt-16">
          <a 
            href="#pricing-section" 
            className="inline-flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary px-6 py-3 rounded-full transition-all duration-300 group"
          >
            See how RippleFX can help you
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
