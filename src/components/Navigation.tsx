
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [scrolled, setScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error.message);
        return;
      }
      // Clear user state and redirect to auth page
      setUser(null);
      navigate("/auth");
    } catch (error) {
      console.error("Unexpected error during sign out:", error);
    }
  };
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-background/95 backdrop-blur-sm shadow-lg' : 'bg-transparent'
    }`}>
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
              {user && (
                <>
                  <Link
                    to="/dashboard"
                    className={`hover:text-primary transition-colors ${
                      isActive("/dashboard") ? "text-primary" : "text-foreground"
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/profile"
                    className={`hover:text-primary transition-colors ${
                      isActive("/profile") ? "text-primary" : "text-foreground"
                    }`}
                  >
                    Profile
                  </Link>
                  <Link
                    to="/connect-broker"
                    className={`hover:text-primary transition-colors ${
                      isActive("/connect-broker") ? "text-primary" : "text-foreground"
                    }`}
                  >
                    Connect Broker
                  </Link>
                </>
              )}
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
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Button onClick={() => navigate("/connect-broker")} variant="outline" className="hidden md:inline-flex hover:bg-primary hover:text-primary-foreground">
                  Connect Broker
                </Button>
                <Button onClick={handleSignOut} variant="outline" className="hidden md:inline-flex hover:bg-primary hover:text-primary-foreground">
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="hidden md:inline-flex hover:bg-primary hover:text-primary-foreground"
                  onClick={() => navigate("/auth")}
                >
                  Sign In
                </Button>
                <Button 
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => {
                    navigate("/auth");
                    localStorage.setItem("authMode", "signup");
                  }}
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
