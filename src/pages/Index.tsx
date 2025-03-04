
import Hero from "@/components/landing/Hero";
import FeatureGrid from "@/components/landing/FeatureGrid";
import PricingSection from "@/components/landing/PricingSection";
import FAQ from "@/components/landing/FAQ";

const Index = () => {
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
