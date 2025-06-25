
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SecurityEvent {
  event_type: string;
  event_details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

export const useSecurityAudit = () => {
  const [isLogging, setIsLogging] = useState(false);

  const logSecurityEvent = useCallback(async (event: SecurityEvent) => {
    try {
      setIsLogging(true);
      
      // Get client info
      const userAgent = navigator.userAgent;
      
      await supabase.rpc('log_security_event', {
        p_event_type: event.event_type,
        p_event_details: event.event_details || null,
        p_ip_address: event.ip_address || null,
        p_user_agent: userAgent,
      });
      
      console.log(`Security event logged: ${event.event_type}`);
    } catch (error) {
      console.error('Failed to log security event:', error);
    } finally {
      setIsLogging(false);
    }
  }, []);

  const logLoginAttempt = useCallback((success: boolean, error?: string) => {
    logSecurityEvent({
      event_type: success ? 'login_success' : 'login_failure',
      event_details: success ? undefined : { error }
    });
  }, [logSecurityEvent]);

  const logPasswordChange = useCallback(() => {
    logSecurityEvent({
      event_type: 'password_change'
    });
  }, [logSecurityEvent]);

  const logBrokerConnection = useCallback((broker_name: string, success: boolean) => {
    logSecurityEvent({
      event_type: success ? 'broker_connection_success' : 'broker_connection_failure',
      event_details: { broker_name }
    });
  }, [logSecurityEvent]);

  const logSuspiciousActivity = useCallback((activity_type: string, details: Record<string, any>) => {
    logSecurityEvent({
      event_type: 'suspicious_activity',
      event_details: { activity_type, ...details }
    });
  }, [logSecurityEvent]);

  return {
    logSecurityEvent,
    logLoginAttempt,
    logPasswordChange,
    logBrokerConnection,
    logSuspiciousActivity,
    isLogging
  };
};
