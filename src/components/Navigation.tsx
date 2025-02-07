
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Navigation = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-secondary/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-2xl font-bold text-primary">
              RippleEffect
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link
                to="/"
                className={`hover:text-primary transition-colors ${
                  isActive("/") ? "text-primary" : "text-foreground"
                }`}
              >
                Home
              </Link>
              <Link
                to="/about"
                className={`hover:text-primary transition-colors ${
                  isActive("/about") ? "text-primary" : "text-foreground"
                }`}
              >
                About Us
              </Link>
              <Link
                to="/features"
                className={`hover:text-primary transition-colors ${
                  isActive("/features") ? "text-primary" : "text-foreground"
                }`}
              >
                Features
              </Link>
              <Link
                to="/pricing"
                className={`hover:text-primary transition-colors ${
                  isActive("/pricing") ? "text-primary" : "text-foreground"
                }`}
              >
                Pricing
              </Link>
              <Link
                to="/testimonials"
                className={`hover:text-primary transition-colors ${
                  isActive("/testimonials") ? "text-primary" : "text-foreground"
                }`}
              >
                Testimonials
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" className="hidden md:inline-flex">
              Sign In
            </Button>
            <Button>Get Started</Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
