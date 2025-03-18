
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Get redirect parameter
  const searchParams = new URLSearchParams(location.search);
  const redirect = searchParams.get('redirect');
  const isReset = searchParams.get('type') === 'recovery';

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Session check error:", error);
        return;
      }
      if (session) {
        handleRedirect();
      }
    };

    checkSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        handleRedirect();
      } else if (event === 'SIGNED_OUT') {
        navigate('/auth');
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token has been refreshed');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, redirect]);

  // Check if we're handling a password reset from email link
  useEffect(() => {
    const handlePasswordReset = async () => {
      if (isReset) {
        setIsPasswordReset(true);
        toast({
          title: "Set New Password",
          description: "Please enter your new password below.",
        });
      }
    };

    handlePasswordReset();
  }, [isReset, toast]);

  const handleRedirect = () => {
    if (redirect === 'pricing') {
      navigate('/?scrollTo=pricing');
    } else {
      navigate('/');
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isForgotPassword) {
        // Get current URL without search parameters to use as the base for redirects
        const baseUrl = window.location.origin;
        const resetRedirectUrl = `${baseUrl}/auth?type=recovery`;
        
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: resetRedirectUrl,
        });

        if (error) throw error;

        toast({
          title: "Password Reset Email Sent",
          description: "Check your email for a password reset link.",
        });
        
        // Return to sign in view
        setIsForgotPassword(false);
      } else if (isPasswordReset) {
        // Handle the password update for users coming from the reset link
        const { error } = await supabase.auth.updateUser({
          password: password,
        });

        if (error) throw error;

        toast({
          title: "Password Updated",
          description: "Your password has been updated successfully. Please sign in with your new password.",
        });
        
        setIsPasswordReset(false);
      } else if (isSignUp) {
        const { data: { session }, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username,
            },
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
          handleRedirect();
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        handleRedirect();
      }
    } catch (error: any) {
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
            {isForgotPassword 
              ? "Reset Your Password" 
              : isPasswordReset
                ? "Set New Password"
                : isSignUp 
                  ? "Create an Account" 
                  : "Welcome Back"}
          </h1>
          <form onSubmit={handleAuth} className="space-y-6">
            {isSignUp && !isForgotPassword && !isPasswordReset && (
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
            
            {!isPasswordReset && (
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
            )}
            
            {!isForgotPassword && (
              <div className="space-y-2">
                <Label htmlFor="password">
                  {isPasswordReset ? "New Password" : "Password"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            )}
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading
                ? "Loading..."
                : isForgotPassword
                  ? "Send Reset Link"
                  : isPasswordReset
                    ? "Update Password"
                    : isSignUp
                      ? "Create Account"
                      : "Sign In"}
            </Button>
          </form>
          
          {/* Authentication options */}
          <div className="mt-4 space-y-3">
            {!isForgotPassword && !isPasswordReset && (
              <p className="text-center text-sm text-muted-foreground">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-primary hover:underline"
                >
                  {isSignUp ? "Sign In" : "Sign Up"}
                </button>
              </p>
            )}
            
            {!isSignUp && !isForgotPassword && !isPasswordReset && (
              <p className="text-center text-sm text-muted-foreground">
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  className="text-primary hover:underline"
                >
                  Forgot your password?
                </button>
              </p>
            )}
            
            {(isForgotPassword || isPasswordReset) && (
              <p className="text-center text-sm text-muted-foreground">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setIsPasswordReset(false);
                  }}
                  className="text-primary hover:underline"
                >
                  Back to Sign In
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
