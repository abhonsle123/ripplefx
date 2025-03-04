
import { Bell, ChartLine, Brain, Zap, Target, Shield, ArrowRight, Lightbulb, Gauge, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const Features = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      } 
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  const features = [
    {
      icon: Bell,
      title: "Real-Time Event Alerts",
      description: "Get instant notifications about market-moving events as they happen. Stay informed and never miss crucial opportunities.",
      color: "from-blue-500/20 to-blue-600/10"
    },
    {
      icon: ChartLine,
      title: "Stock Impact Predictions",
      description: "Leverage our AI-powered analysis to understand how events will impact stock prices and market movements.",
      color: "from-green-500/20 to-green-600/10"
    },
    {
      icon: Brain,
      title: "AI Market Analysis",
      description: "Access cutting-edge AI algorithms that help you make data-driven investment decisions with confidence.",
      color: "from-purple-500/20 to-purple-600/10"
    },
    {
      icon: Zap,
      title: "Smart Notifications",
      description: "Customize your alert preferences to receive only the most relevant updates for your investment strategy.",
      color: "from-yellow-500/20 to-yellow-600/10"
    },
    {
      icon: Target,
      title: "Sector Tracking",
      description: "Monitor specific industries and sectors with detailed impact analysis and performance metrics.",
      color: "from-red-500/20 to-red-600/10"
    },
    {
      icon: Gauge,
      title: "Risk Assessment",
      description: "Evaluate potential risks and opportunities with our comprehensive market analysis tools.",
      color: "from-indigo-500/20 to-indigo-600/10"
    },
    {
      icon: Lightbulb,
      title: "Investment Insights",
      description: "Discover new investment opportunities through our intelligent event analysis and recommendations.",
      color: "from-amber-500/20 to-amber-600/10"
    },
    {
      icon: Lock,
      title: "Secure Platform",
      description: "Your data is protected with enterprise-grade security measures and encryption protocols.",
      color: "from-gray-500/20 to-gray-600/10"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background/90 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 right-1/3 w-60 h-60 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>
      
      <div className="container px-4 pt-32 relative z-10">
        <motion.div 
          className="max-w-4xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div 
            className="text-center space-y-4 mb-16"
            variants={itemVariants}
          >
            <h1 className="text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Powerful <span className="text-primary">Features</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Everything you need to make informed investment decisions
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="p-8 rounded-xl bg-card/40 backdrop-blur-sm border border-accent/10 hover:scale-[1.03] transition-all duration-300 shadow-lg shadow-primary/5 group"
                variants={itemVariants}
                whileHover={{ y: -5 }}
                custom={index}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:shadow-md transition-all duration-300`}>
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div 
            className="mt-16 text-center"
            variants={itemVariants}
          >
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 group shadow-lg shadow-primary/20 hover:translate-y-[-2px] transition-transform"
              onClick={() => navigate("/auth")}
            >
              Get Started
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Features;
