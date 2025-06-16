
import { Shield, LineChart, BellRing, Zap, Brain, TrendingUp } from "lucide-react";

const FeatureGrid = () => {
  const features = [
    {
      icon: <Shield className="w-8 h-8 text-blue-400" />,
      title: "Risk Protection",
      description: "Advanced risk analysis and real-time market monitoring to safeguard your investments from unexpected market movements.",
      gradient: "from-blue-500/20 to-cyan-500/20"
    },
    {
      icon: <Brain className="w-8 h-8 text-purple-400" />,
      title: "AI-Powered Analytics",
      description: "Machine learning algorithms analyze market patterns, news sentiment, and historical data to predict future market movements.",
      gradient: "from-purple-500/20 to-pink-500/20"
    },
    {
      icon: <BellRing className="w-8 h-8 text-green-400" />,
      title: "Real-Time Alerts",
      description: "Get instant notifications about market-moving events with customizable alert rules and multiple delivery channels.",
      gradient: "from-green-500/20 to-emerald-500/20"
    },
    {
      icon: <Zap className="w-8 h-8 text-yellow-400" />,
      title: "Lightning Fast",
      description: "Sub-second event detection and analysis ensures you're always first to know about critical market developments.",
      gradient: "from-yellow-500/20 to-orange-500/20"
    },
    {
      icon: <LineChart className="w-8 h-8 text-indigo-400" />,
      title: "Predictive Insights",
      description: "Advanced forecasting models provide confidence scores and probability assessments for potential market impacts.",
      gradient: "from-indigo-500/20 to-purple-500/20"
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-rose-400" />,
      title: "Market Intelligence",
      description: "Comprehensive market data aggregation from multiple sources provides a complete picture of market conditions.",
      gradient: "from-rose-500/20 to-red-500/20"
    }
  ];

  return (
    <div className="bg-slate-900 py-24 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl opacity-60"></div>
      </div>

      <div className="container px-4 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Advanced Market Intelligence
            <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mt-2">
              Built for Modern Traders
            </span>
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Harness the power of AI and real-time data to make informed trading decisions 
            with confidence and precision.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ feature, index }: { feature: any, index: number }) => {
  return (
    <div 
      className={`group relative p-8 rounded-2xl bg-gradient-to-br ${feature.gradient} backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-500 hover:translate-y-[-8px] hover:shadow-2xl animate-fadeInUp`}
      style={{ animationDelay: `${index * 150}ms` }}
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      {/* Icon container */}
      <div className="relative mb-6">
        <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
          {feature.icon}
        </div>
      </div>

      {/* Content */}
      <h3 className="text-xl font-semibold mb-4 text-white group-hover:text-white transition-colors duration-300">
        {feature.title}
      </h3>
      <p className="text-slate-300 leading-relaxed">
        {feature.description}
      </p>

      {/* Decorative elements */}
      <div className="absolute top-4 right-4 w-2 h-2 bg-white/20 rounded-full animate-pulse"></div>
      <div className="absolute bottom-4 left-4 w-1 h-1 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
    </div>
  );
};

export default FeatureGrid;
