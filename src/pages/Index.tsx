
import { useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Helmet } from "react-helmet";
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
    <>
      <Helmet>
        <title>RippleFX - Real-Time Market Intelligence & AI-Powered Trading Platform</title>
        <meta name="description" content="RippleFX provides real-time market impact analysis, AI-powered stock predictions, and automated trading alerts. Stay ahead of market-moving events with advanced analytics and predictive insights." />
        <meta name="keywords" content="RippleFX, market intelligence, AI trading, stock predictions, real-time alerts, market analysis, trading platform, financial analytics" />
        <link rel="canonical" href="https://ripplefx.com" />
        
        {/* Structured Data for HomePage */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "RippleFX - Real-Time Market Intelligence",
            "description": "AI-powered trading platform with real-time market analysis and stock predictions",
            "url": "https://ripplefx.com",
            "mainEntity": {
              "@type": "SoftwareApplication",
              "name": "RippleFX",
              "applicationCategory": "FinanceApplication",
              "operatingSystem": "Web",
              "description": "Real-time market intelligence and AI-powered trading platform"
            }
          })}
        </script>
      </Helmet>
      
      <main className="min-h-screen bg-slate-900 overflow-hidden">
        {/* Semantic HTML structure for better SEO */}
        <header>
          <Hero />
        </header>
        
        <section aria-label="How RippleFX Works">
          <ScrollAnimationWrapper variant="fadeUp">
            <HowItWorks />
          </ScrollAnimationWrapper>
        </section>
        
        <section aria-label="RippleFX Features">
          <ScrollAnimationWrapper variant="scaleIn">
            <FeatureGrid />
          </ScrollAnimationWrapper>
        </section>
        
        <section aria-label="Pricing Plans">
          <ScrollAnimationWrapper variant="fadeUp">
            <PricingSection />
          </ScrollAnimationWrapper>
        </section>
        
        <section aria-label="Frequently Asked Questions">
          <ScrollAnimationWrapper variant="scaleIn">
            <FAQ />
          </ScrollAnimationWrapper>
        </section>
      </main>
    </>
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
