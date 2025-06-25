
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSecurityAudit } from "@/hooks/useSecurityAudit";
import { useRateLimit } from "@/hooks/useRateLimit";
import { passwordSchema, emailSchema } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SecureForm } from "@/components/security/SecureForm";
import { AlertTriangle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface SecureAuthProps {
  mode: 'signin' | 'signup';
  onSuccess?: () => void;
}

export const SecureAuth: React.FC<SecureAuthProps> = ({ mode, onSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { logLoginAttempt } = useSecurityAudit();
  const { isRateLimited, getRemainingTime } = useRateLimit('AUTH_ATTEMPTS');

  // Real-time password strength validation
  useEffect(() => {
    if (mode === 'signup' && password) {
      const issues: string[] = [];
      
      if (password.length < 8) issues.push("At least 8 characters");
      if (!/[A-Z]/.test(password)) issues.push("One uppercase letter");
      if (!/[a-z]/.test(password)) issues.push("One lowercase letter");
      if (!/[0-9]/.test(password)) issues.push("One number");
      
      setPasswordStrength(issues);
    }
  }, [password, mode]);

  const handleAuth = async (formData: FormData) => {
    if (isRateLimited()) {
      const remainingTime = Math.ceil(getRemainingTime() / 1000);
      throw new Error(`Too many authentication attempts. Please wait ${remainingTime} seconds.`);
    }

    setIsLoading(true);

    try {
      // Validate email
      const emailValidation = emailSchema.safeParse(email);
      if (!emailValidation.success) {
        throw new Error(emailValidation.error.errors[0].message);
      }

      // Validate password for signup
      if (mode === 'signup') {
        const passwordValidation = passwordSchema.safeParse(password);
        if (!passwordValidation.success) {
          throw new Error(passwordValidation.error.errors[0].message);
        }

        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
      }

      let result;
      
      if (mode === 'signin') {
        result = await supabase.auth.signInWithPassword({
          email: emailValidation.data,
          password
        });
      } else {
        result = await supabase.auth.signUp({
          email: emailValidation.data,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              email_confirm: true
            }
          }
        });
      }

      if (result.error) {
        logLoginAttempt(false, result.error.message);
        throw new Error(result.error.message);
      }

      logLoginAttempt(true);
      
      if (mode === 'signup') {
        toast.success("Account created! Please check your email to confirm your account.");
      } else {
        toast.success("Successfully signed in!");
      }
      
      onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Authentication failed";
      logLoginAttempt(false, errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  if (isRateLimited()) {
    const remainingTime = Math.ceil(getRemainingTime() / 1000);
    
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Too many authentication attempts. Please wait {remainingTime} seconds before trying again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <SecureForm onSubmit={handleAuth} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
          autoComplete="email"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        
        {mode === 'signup' && password && passwordStrength.length > 0 && (
          <div className="text-sm text-muted-foreground">
            <p>Password must include:</p>
            <ul className="list-disc list-inside">
              {passwordStrength.map((requirement, index) => (
                <li key={index} className="text-red-500">{requirement}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {mode === 'signup' && (
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            required
            autoComplete="new-password"
          />
        </div>
      )}

      <Button 
        type="submit" 
        className="w-full" 
        disabled={isLoading || (mode === 'signup' && passwordStrength.length > 0)}
      >
        {isLoading ? "Processing..." : mode === 'signin' ? "Sign In" : "Sign Up"}
      </Button>
    </SecureForm>
  );
};
