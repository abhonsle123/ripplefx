
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if user is already logged in and handle session persistence
  useEffect(() => {
    // Initialize session check
    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Session initialization error:", error);
          return;
        }
        if (session) {
          console.log("Valid session found, redirecting to home");
          navigate('/');
        }
      } catch (error) {
        console.error("Session initialization failed:", error);
      }
    };

    initSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);
      
      if (event === 'SIGNED_IN' && session) {
        console.log("User signed in, redirecting to home");
        navigate('/');
      } else if (event === 'SIGNED_OUT') {
        console.log("User signed out, staying on auth page");
        navigate('/auth');
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token has been refreshed');
      } else if (event === 'USER_UPDATED') {
        console.log('User data has been updated');
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { data: { session }, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username,
            },
            // Enable persistent sessions
            emailRedirectTo: window.location.origin,
          },
        });

        if (error) throw error;

        if (!session) {
          toast({
            title: "Success!",
            description: "Please check your email to confirm your account.",
          });
        } else {
          toast({
            title: "Success!",
            description: "Account created successfully. You can now sign in.",
          });
          navigate('/');
        }
      } else {
        const { data: { session }, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;

        if (session) {
          console.log("Login successful, session established");
          navigate('/');
        }
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 bg-background">
      <div className="container px-4">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">
            {isSignUp ? "Create an Account" : "Welcome Back"}
          </h1>
          <form onSubmit={handleAuth} className="space-y-6">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  minLength={3}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading
                ? "Loading..."
                : isSignUp
                ? "Create Account"
                : "Sign In"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary hover:underline"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
