
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import Hero from "@/components/landing/Hero";
import FeatureGrid from "@/components/landing/FeatureGrid";
import PricingSection from "@/components/landing/PricingSection";
import FAQ from "@/components/landing/FAQ";

const Index = () => {
  const location = useLocation();
  
  useEffect(() => {
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
  }, [location]);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Hero />
      <FeatureGrid />
      <PricingSection />
      <FAQ />
    </div>
  );
};

export default Index;
