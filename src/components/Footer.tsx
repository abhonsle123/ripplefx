
import { Github, Twitter, Linkedin } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const Footer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const scrollToFAQ = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // If we're not on the home page, navigate to home and then scroll to FAQ
    if (location.pathname !== '/') {
      navigate('/?scrollTo=faq');
      return;
    }
    
    // If already on home page, just scroll to the FAQ section
    const faqSection = document.getElementById('faq-section');
    if (faqSection) {
      faqSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToPricing = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // If we're not on the home page, navigate to home and then scroll to pricing
    if (location.pathname !== '/') {
      navigate('/?scrollTo=pricing');
      return;
    }
    
    // If already on home page, just scroll to the pricing section
    const pricingSection = document.getElementById('pricing-section');
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-[#111317] border-t border-white/5">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Copyright */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-white">RippleEffect</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Copyright © {new Date().getFullYear()} RippleEffect. All rights reserved.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Product</h3>
            <ul className="space-y-2">
              <li><Link to="/features" className="text-muted-foreground hover:text-white transition-colors">Features</Link></li>
              <li><a href="#pricing" onClick={scrollToPricing} className="text-muted-foreground hover:text-white transition-colors cursor-pointer">Pricing</a></li>
              <li><a href="#faq" onClick={scrollToFAQ} className="text-muted-foreground hover:text-white transition-colors cursor-pointer">FAQs</a></li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Company</h3>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-muted-foreground hover:text-white transition-colors">About</Link></li>
              <li><Link to="/contact" className="text-muted-foreground hover:text-white transition-colors">Contact</Link></li>
              <li><Link to="/privacy" className="text-muted-foreground hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-muted-foreground hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Connect</h3>
            <div className="flex space-x-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-white transition-colors"
              >
                <Github className="h-6 w-6" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-white transition-colors"
              >
                <Twitter className="h-6 w-6" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-white transition-colors"
              >
                <Linkedin className="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
