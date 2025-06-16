
import { ArrowDown, ArrowRight, BellRing, LineChart, Zap, Database, Cpu, AlertTriangle } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const HowItWorks = () => {
  const steps = [
    {
      icon: <Database className="w-10 h-10 text-blue-400" />,
      title: "Data Ingestion",
      description: "Our AI continuously monitors hundreds of data sources including news feeds, social media, earnings reports, and market indicators to detect emerging events.",
      gradient: "from-blue-500/20 to-cyan-500/20"
    },
    {
      icon: <Cpu className="w-10 h-10 text-purple-400" />,
      title: "AI Analysis",
      description: "Advanced machine learning models analyze event significance, market sentiment, and historical patterns to predict potential market impact with confidence scores.",
      gradient: "from-purple-500/20 to-pink-500/20"
    },
    {
      icon: <AlertTriangle className="w-10 h-10 text-green-400" />,
      title: "Smart Alerts",
      description: "Receive personalized notifications with actionable insights, risk assessments, and recommended actions based on your portfolio and preferences.",
      gradient: "from-green-500/20 to-emerald-500/20"
    }
  ];

  return (
    <div className="bg-slate-800/50 py-24 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-72 h-72 bg-gradient-radial from-blue-500/20 to-transparent blur-3xl opacity-60"></div>
        <div className="absolute bottom-1/4 right-0 w-72 h-72 bg-gradient-radial from-purple-500/20 to-transparent blur-3xl opacity-60"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:60px_60px] opacity-30"></div>
      </div>

      <div className="container px-4 relative z-10">
        <SectionTitle />

        <div className="relative max-w-6xl mx-auto">
          {/* Process flow */}
          <div className="grid md:grid-cols-3 gap-8 md:gap-12 relative">
            {steps.map((step, index) => (
              <StepCard key={index} step={step} index={index} />
            ))}
            
            {/* Connection lines for desktop */}
            <div className="hidden md:block absolute top-1/2 left-[33.3%] transform -translate-x-1/2 -translate-y-1/2 z-20">
              <div className="flex items-center">
                <div className="w-16 h-0.5 bg-gradient-to-r from-blue-400/60 to-purple-400/60"></div>
                <ArrowRight className="w-5 h-5 text-purple-400/80 ml-2" />
              </div>
            </div>
            <div className="hidden md:block absolute top-1/2 left-[66.7%] transform -translate-x-1/2 -translate-y-1/2 z-20">
              <div className="flex items-center">
                <div className="w-16 h-0.5 bg-gradient-to-r from-purple-400/60 to-green-400/60"></div>
                <ArrowRight className="w-5 h-5 text-green-400/80 ml-2" />
              </div>
            </div>
          </div>
          
          {/* Mobile flow indicators */}
          <div className="md:hidden flex flex-col items-center space-y-4 my-8">
            <div className="flex flex-col items-center">
              <div className="w-0.5 h-8 bg-gradient-to-b from-blue-400/60 to-purple-400/60"></div>
              <ArrowDown className="w-5 h-5 text-purple-400/80" />
            </div>
            <div className="flex flex-col items-center">
              <div className="w-0.5 h-8 bg-gradient-to-b from-purple-400/60 to-green-400/60"></div>
              <ArrowDown className="w-5 h-5 text-green-400/80" />
            </div>
          </div>
        </div>

        {/* CTA section */}
        <div className="text-center mt-20">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm px-8 py-4 rounded-full border border-white/10 hover:border-white/20 transition-all duration-500 group cursor-pointer">
            <span className="text-white font-medium">Experience RippleEffect in Action</span>
            <ArrowRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform duration-300" />
          </div>
        </div>
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
    <div ref={ref} className={`text-center mb-20 ${animationClasses}`}>
      <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
        How <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">RippleEffect</span> Works
      </h2>
      <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
        Our three-step process transforms market chaos into actionable intelligence, 
        giving you the edge you need to make confident trading decisions.
      </p>
    </div>
  );
};

// Individual step card with enhanced styling
const StepCard = ({ step, index }: { step: any, index: number }) => {
  const { ref, animationClasses, style } = useScrollAnimation({
    threshold: 0.1,
    variant: 'scaleIn',
    delay: index * 200
  });
  
  return (
    <div 
      ref={ref} 
      className={`group relative p-8 rounded-2xl bg-gradient-to-br ${step.gradient} backdrop-blur-sm border border-white/10 hover:border-white/20 text-center hover:translate-y-[-8px] transition-all duration-500 ${animationClasses}`}
      style={style}
    >
      {/* Step number */}
      <div className="absolute -top-4 left-8 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
        {index + 1}
      </div>

      {/* Glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      {/* Icon */}
      <div className="relative mb-6">
        <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm mx-auto group-hover:scale-110 transition-transform duration-300">
          {step.icon}
        </div>
      </div>

      {/* Content */}
      <h3 className="text-2xl font-semibold mb-4 text-white">{step.title}</h3>
      <p className="text-slate-300 leading-relaxed">{step.description}</p>

      {/* Decorative pulse */}
      <div className="absolute bottom-4 right-4 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
    </div>
  );
};

export default HowItWorks;
