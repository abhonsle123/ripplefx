
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const About = () => {
  return (
    <div className="min-h-screen bg-background text-foreground pt-32">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto text-center animate-fadeIn">
          <h1 className="text-4xl font-bold mb-8">About RippleEffect</h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            RippleEffect's mission is to empower investors with actionable insights
            into global events that move markets. We combine cutting-edge AI
            technology with real-time data to ensure you never miss an opportunity
            to capitalize on market trends.
          </p>
          <Button className="group" size="lg">
            Start Your Journey
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default About;
