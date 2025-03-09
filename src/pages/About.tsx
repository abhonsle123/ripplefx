
import { ArrowRight, Users, LineChart, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const About = () => {
  const navigate = useNavigate();
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.15,
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
  
  // Section scroll animation
  const { ref: sectionRef, isVisible: sectionVisible } = useScrollAnimation(0.1);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background/90 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>
      
      <div className="container px-4 pt-32 relative z-10">
        <motion.div 
          className="max-w-3xl mx-auto text-center space-y-8"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.h1 
            className="text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent"
            variants={itemVariants}
          >
            About <span className="text-primary">RippleEffect</span>
          </motion.h1>
          
          <motion.p 
            className="text-xl text-muted-foreground leading-relaxed"
            variants={itemVariants}
          >
            RippleEffect's mission is to empower investors with actionable insights
            into global events that move markets. We combine cutting-edge AI
            technology with real-time data to ensure you never miss an opportunity
            to capitalize on market trends.
          </motion.p>
          
          <div 
            ref={sectionRef}
            className={`space-y-12 pt-8 transition-all duration-1000 transform ${
              sectionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
            }`}
          >
            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature cards with individual scroll animations */}
              <FeatureCard
                icon={<Users className="w-8 h-8 text-primary" />}
                title="Real-Time Insights"
                description="Get instant notifications about market-moving events as they happen, keeping you ahead of the curve."
                delay={0}
              />
              
              <FeatureCard
                icon={<LineChart className="w-8 h-8 text-primary" />}
                title="AI-Powered Analysis"
                description="Our advanced AI algorithms analyze events and predict potential market impacts with high accuracy."
                delay={200}
              />
              
              <FeatureCard
                icon={<Shield className="w-8 h-8 text-primary" />}
                title="Smart Alerts"
                description="Customize your alert preferences and receive notifications that matter most to your investment strategy."
                delay={400}
              />
            </div>
            
            <motion.div
              className="flex justify-center mt-8"
              variants={itemVariants}
            >
              <Button 
                className="group bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                size="lg"
                onClick={() => navigate("/auth")}
              >
                Start Your Journey
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// Feature card with scroll animation
const FeatureCard = ({ icon, title, description, delay }: { 
  icon: React.ReactNode,
  title: string,
  description: string,
  delay: number
}) => {
  const { ref, isVisible } = useScrollAnimation(0.1);
  
  return (
    <div 
      ref={ref} 
      className={`p-8 rounded-xl bg-card/40 backdrop-blur-sm border border-accent/10 hover:scale-[1.03] transition-all duration-700 transform shadow-lg shadow-primary/5 group ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-16'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="p-3 bg-primary/10 rounded-lg inline-flex mb-4 group-hover:bg-primary/20 transition-all duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3 text-foreground">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
};

export default About;
