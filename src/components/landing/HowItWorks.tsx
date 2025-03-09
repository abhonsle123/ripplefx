
import { ArrowDown, ArrowRight, BellRing, LineChart, Zap } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

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
    <div className="relative py-24 overflow-hidden">
      {/* Curved transition from Hero section */}
      <div className="absolute top-0 left-0 w-full overflow-hidden leading-0 transform rotate-180">
        <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-24 text-background">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="currentColor"></path>
        </svg>
      </div>
      
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-2/3 h-32 bg-gradient-radial from-primary/10 to-transparent blur-2xl opacity-50"></div>
        <div className="absolute bottom-0 right-0 w-1/2 h-32 bg-gradient-radial from-primary/10 to-transparent blur-2xl opacity-50"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:40px_40px] opacity-10"></div>
      </div>

      <div className="container px-4">
        <SectionTitle />

        <div className="relative max-w-4xl mx-auto">
          {/* Process steps */}
          <div className="grid md:grid-cols-3 gap-6 md:gap-8 relative z-10">
            {steps.map((step, index) => (
              <StepCard key={index} step={step} index={index} />
            ))}
            
            {/* Correctly positioned arrows between cards */}
            <div className="hidden md:block absolute top-1/2 left-[33.3%] transform -translate-x-1/2 -translate-y-1/2 z-20">
              <ArrowRight className="w-6 h-6 text-primary/80 animate-bounce" />
            </div>
            <div className="hidden md:block absolute top-1/2 left-[66.7%] transform -translate-x-1/2 -translate-y-1/2 z-20">
              <ArrowRight className="w-6 h-6 text-primary/80 animate-bounce" style={{ animationDelay: "0.5s" }} />
            </div>
          </div>
          
          {/* Mobile arrow indicators */}
          <div className="md:hidden flex flex-col items-center space-y-2 my-2">
            <ArrowDown className="w-6 h-6 text-primary/80 animate-bounce" />
            <ArrowDown className="w-6 h-6 text-primary/80 animate-bounce" style={{ animationDelay: "0.5s" }} />
          </div>
        </div>

        {/* Call to action button */}
        <div className="text-center mt-16">
          <a 
            href="#pricing-section" 
            className="inline-flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary px-6 py-3 rounded-full transition-all duration-500 group hover:shadow-lg hover:shadow-primary/20"
          >
            See how RippleFX can help you
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
          </a>
        </div>
      </div>
      
      {/* Bottom wave transition to next section */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-0">
        <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-24 text-background">
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" fill="currentColor"></path>
          <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" fill="currentColor"></path>
          <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" fill="currentColor"></path>
        </svg>
      </div>
    </div>
  );
};

// Section title with scroll animation
const SectionTitle = () => {
  const { ref, animationClasses } = useScrollAnimation({
    threshold: 0.2,
    variant: 'fadeUp'
  });
  
  return (
    <div ref={ref} className={`text-center mb-16 ${animationClasses}`}>
      <h2 className="text-3xl font-bold text-foreground mb-4">
        How <span className="text-primary">RippleFX</span> Works
      </h2>
      <p className="text-muted-foreground max-w-2xl mx-auto">
        Our AI-powered platform helps you stay ahead of market movements with real-time analysis and alerts
      </p>
    </div>
  );
};

// Individual step card with scroll animation
const StepCard = ({ step, index }: { step: any, index: number }) => {
  const { ref, animationClasses, style } = useScrollAnimation({
    threshold: 0.1,
    variant: 'scaleIn',
    delay: index * 150
  });
  
  return (
    <div 
      ref={ref} 
      className={`bg-card/60 backdrop-blur-sm p-8 rounded-xl border border-white/5 flex flex-col items-center text-center hover:bg-card/80 transition-all duration-500 hover:translate-y-[-8px] hover:shadow-lg ${animationClasses}`}
      style={style}
    >
      <div className="p-4 rounded-full bg-primary/10 mb-6 animate-pulse">
        {step.icon}
      </div>
      <h3 className="text-xl font-semibold mb-3 text-foreground">{step.title}</h3>
      <p className="text-muted-foreground">{step.description}</p>
    </div>
  );
};

export default HowItWorks;
