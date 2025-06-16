
import { ArrowRight, TrendingUp, BarChart3, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Advanced gradient background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-background to-slate-900" />
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/20 via-transparent to-purple-900/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(59,130,246,0.15)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_75%,rgba(147,51,234,0.15)_0%,transparent_50%)]" />
      </div>

      {/* Animated 3D elements container */}
      <div className="absolute inset-0 overflow-hidden">
        <AnimatedElements />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(59,130,246,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(59,130,246,0.1)_1px,transparent_1px)] bg-[size:40px_40px] opacity-30" />

      <div className="container relative px-4 pt-32 pb-20 z-10">
        <div className="text-center max-w-4xl mx-auto space-y-8">
          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight text-white leading-tight">
            Real-Time Market Intelligence 
            <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-blue-600 bg-clip-text text-transparent mt-2">
              Powered by AI
            </span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Stay ahead of market-moving events with advanced AI analysis, 
            real-time alerts, and predictive insights that protect your investments.
          </p>

          {/* Tech badges */}
          <div className="flex items-center justify-center gap-4 pt-4">
            <TechBadge icon={<Zap className="w-4 h-4" />} text="AI" />
            <TechBadge icon={<BarChart3 className="w-4 h-4" />} text="Analytics" />
            <TechBadge icon={<TrendingUp className="w-4 h-4" />} text="Predictions" />
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-12">
            <Button 
              className="w-full sm:w-auto group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg rounded-xl transition-all duration-300 hover:translate-y-[-2px] hover:shadow-xl shadow-blue-500/25" 
              size="lg"
              onClick={() => {
                navigate("/pricing?scrollTo=pricing");
              }}
            >
              Get Started
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
            <Button 
              variant="outline"
              className="w-full sm:w-auto bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 px-8 py-4 text-lg rounded-xl transition-all duration-300 hover:translate-y-[-2px]"
              size="lg"
              onClick={() => navigate("/features")}
            >
              Documentation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Tech badge component
const TechBadge = ({ icon, text }: { icon: React.ReactNode, text: string }) => (
  <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-white/90">
    {icon}
    <span className="text-sm font-medium">{text}</span>
  </div>
);

// Animated 3D-style elements
const AnimatedElements = () => {
  return (
    <div className="absolute inset-0">
      {/* Floating market-themed cards */}
      <div className="absolute top-1/4 left-[10%] animate-floating">
        <MarketCard title="AAPL" value="+2.4%" positive delay="0s" />
      </div>
      
      <div className="absolute top-1/3 right-[15%] animate-floating" style={{ animationDelay: '1s' }}>
        <MarketCard title="TSLA" value="-1.2%" positive={false} delay="1s" />
      </div>
      
      <div className="absolute bottom-1/3 left-[20%] animate-floating" style={{ animationDelay: '2s' }}>
        <MarketCard title="NVDA" value="+5.7%" positive delay="2s" />
      </div>
      
      <div className="absolute top-1/2 right-[25%] animate-floating" style={{ animationDelay: '0.5s' }}>
        <MarketCard title="SPY" value="+0.8%" positive delay="0.5s" />
      </div>

      {/* Floating geometric shapes */}
      <div className="absolute top-[20%] right-[10%] w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg backdrop-blur-sm border border-white/10 animate-floating" style={{ animationDelay: '3s' }} />
      
      <div className="absolute bottom-[25%] right-[35%] w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full backdrop-blur-sm border border-white/10 animate-floating" style={{ animationDelay: '1.5s' }} />
      
      <div className="absolute top-[60%] left-[5%] w-12 h-12 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-lg backdrop-blur-sm border border-white/10 animate-floating rotate-45" style={{ animationDelay: '2.5s' }} />

      {/* Connecting lines/paths */}
      <svg className="absolute inset-0 w-full h-full opacity-20">
        <defs>
          <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <path 
          d="M 200 300 Q 400 200 600 400 T 900 300" 
          stroke="url(#pathGradient)" 
          strokeWidth="2" 
          fill="none"
          className="animate-pulse"
        />
        <path 
          d="M 100 500 Q 300 350 500 550 T 800 450" 
          stroke="url(#pathGradient)" 
          strokeWidth="1.5" 
          fill="none"
          className="animate-pulse"
          style={{ animationDelay: '1s' }}
        />
      </svg>
    </div>
  );
};

// Market card component for floating elements
const MarketCard = ({ title, value, positive, delay }: { 
  title: string, 
  value: string, 
  positive: boolean, 
  delay: string 
}) => (
  <div 
    className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20 min-w-[100px] hover:bg-white/20 transition-all duration-300"
    style={{ animationDelay: delay }}
  >
    <div className="text-white/90 text-sm font-medium">{title}</div>
    <div className={`text-lg font-bold ${positive ? 'text-green-400' : 'text-red-400'}`}>
      {value}
    </div>
  </div>
);

export default Hero;
