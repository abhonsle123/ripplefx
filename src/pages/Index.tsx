
import { useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import FeatureGrid from "@/components/landing/FeatureGrid";
import PricingSection from "@/components/landing/PricingSection";
import FAQ from "@/components/landing/FAQ";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const Index = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    // Handle success or canceled payment
    if (searchParams.get('success') === 'true') {
      toast.success("Your subscription was successful! Welcome to the Premium plan.");
    } else if (searchParams.get('canceled') === 'true') {
      toast.info("Your subscription process was canceled.");
    }
    
    // Handle scroll to pricing section
    if (location.search.includes('scrollTo=pricing')) {
      // Small delay to ensure the component is fully rendered
      setTimeout(() => {
        const pricingSection = document.getElementById('pricing-section');
        if (pricingSection) {
          pricingSection.scrollIntoView({ behavior: 'smooth' });
          
          // Clean up the URL without refreshing the page
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        }
      }, 100);
    }
  }, [location, searchParams]);

  return (
    <div className="min-h-screen bg-slate-900 overflow-hidden">
      <Hero />
      <ScrollAnimationWrapper variant="fadeUp">
        <HowItWorks />
      </ScrollAnimationWrapper>
      <ScrollAnimationWrapper variant="scaleIn">
        <FeatureGrid />
      </ScrollAnimationWrapper>
      <ScrollAnimationWrapper variant="fadeUp">
        <PricingSection />
      </ScrollAnimationWrapper>
      <ScrollAnimationWrapper variant="scaleIn">
        <FAQ />
      </ScrollAnimationWrapper>
    </div>
  );
};

// ScrollAnimationWrapper component that uses the useScrollAnimation hook
const ScrollAnimationWrapper = ({ 
  children, 
  variant = 'default' 
}: { 
  children: React.ReactNode, 
  variant?: 'fadeUp' | 'scaleIn' | 'revealLeft' | 'revealRight' | 'default' 
}) => {
  const { ref, animationClasses } = useScrollAnimation({ 
    threshold: 0.1,
    variant
  });
  
  return (
    <div ref={ref} className={animationClasses}>
      {children}
    </div>
  );
};

export default Index;
