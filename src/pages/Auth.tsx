
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
  
  // Parse URL parameters
  const searchParams = new URLSearchParams(location.search);
  
  // Extract potential reset token parameters from the URL
  // Supabase sends different parameters in their reset link
  const hasTypeRecovery = searchParams.get('type') === 'recovery';
  const hasAccessToken = !!searchParams.get('access_token');
  const hasRefreshToken = !!searchParams.get('refresh_token');
  const hasExpiresIn = !!searchParams.get('expires_in');
  const hasExpiresAt = !!searchParams.get('expires_at');
  
  // Determine if this is a password reset request based on URL parameters
  const isPasswordResetRequest = hasTypeRecovery || 
    (hasAccessToken && hasRefreshToken && (hasExpiresIn || hasExpiresAt));
  
  // Get redirect parameter
  const redirect = searchParams.get('redirect');

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Session check error:", error);
        return;
      }
      if (session && !isPasswordResetRequest) {
        handleRedirect();
      }
    };

    checkSession();
  }, []);

  // Set up auth state change listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change event:", event);
      
      if (event === 'SIGNED_IN' && session && !isPasswordResetRequest) {
        handleRedirect();
      } else if (event === 'SIGNED_OUT') {
        navigate('/auth');
      } else if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordReset(true);
        toast({
          title: "Set New Password",
          description: "Please enter your new password below.",
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, redirect]);

  // Handle password reset from URL parameters
  useEffect(() => {
    if (isPasswordResetRequest) {
      console.log("Password reset detected from URL parameters");
      setIsPasswordReset(true);
      toast({
        title: "Set New Password",
        description: "Please enter your new password below.",
      });
    }
  }, [isPasswordResetRequest, toast]);

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
        // Get absolute URL for redirection
        const baseUrl = window.location.origin;
        const resetRedirectUrl = `${baseUrl}/auth?type=recovery`;
        
        console.log("Sending password reset to:", email);
        console.log("With redirect URL:", resetRedirectUrl);
        
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
        // Handle password update for users with reset token
        console.log("Updating password in reset flow");
        
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
      console.error("Auth error:", error);
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
