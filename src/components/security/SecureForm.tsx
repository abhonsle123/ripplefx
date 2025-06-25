
import React, { useState, useRef } from "react";
import { useRateLimit } from "@/hooks/useRateLimit";
import { useSecurityAudit } from "@/hooks/useSecurityAudit";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Shield } from "lucide-react";

interface SecureFormProps {
  onSubmit: (data: FormData) => Promise<void>;
  children: React.ReactNode;
  className?: string;
  requiresAuth?: boolean;
}

export const SecureForm: React.FC<SecureFormProps> = ({
  onSubmit,
  children,
  className = "",
  requiresAuth = true
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const { recordAttempt, isRateLimited, getRemainingTime } = useRateLimit('FORM_SUBMISSIONS');
  const { logSuspiciousActivity } = useSecurityAudit();

  const generateCSRFToken = () => {
    return crypto.randomUUID();
  };

  const [csrfToken] = useState(() => generateCSRFToken());

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Rate limiting check
    if (isRateLimited()) {
      const remainingTime = Math.ceil(getRemainingTime() / 1000);
      setError(`Too many attempts. Please wait ${remainingTime} seconds before trying again.`);
      
      logSuspiciousActivity('rate_limit_exceeded', {
        form_action: 'form_submission',
        remaining_time: remainingTime
      });
      return;
    }

    if (!recordAttempt()) {
      setError("Request blocked. Please try again later.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      
      // Add CSRF token to form data
      formData.append('csrf_token', csrfToken);
      
      // Basic form validation
      const formEntries = Array.from(formData.entries());
      for (const [key, value] of formEntries) {
        if (typeof value === 'string') {
          // Check for potentially malicious content
          if (value.includes('<script>') || value.includes('javascript:')) {
            logSuspiciousActivity('malicious_form_content', {
              field: key,
              content_preview: value.substring(0, 100)
            });
            throw new Error("Invalid form content detected.");
          }
        }
      }

      await onSubmit(formData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      
      // Log form submission errors for security monitoring
      logSuspiciousActivity('form_submission_error', {
        error: errorMessage,
        form_fields: Array.from(new FormData(e.currentTarget).keys())
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isRateLimited()) {
    const remainingTime = Math.ceil(getRemainingTime() / 1000);
    
    return (
      <div className={`space-y-4 ${className}`}>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Too many attempts. Please wait {remainingTime} seconds before trying again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      {/* Hidden CSRF token */}
      <input type="hidden" name="csrf_token" value={csrfToken} />
      
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {children}
      
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Shield className="h-3 w-3" />
        <span>This form is protected by security measures</span>
      </div>
    </form>
  );
};
