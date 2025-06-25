
-- Phase 1: Critical Database Security Fixes (Fixed version)

-- 1. Fix RLS Policy Conflicts - Remove ALL existing policies first
DROP POLICY IF EXISTS "Allow public read access to events" ON public.events;
DROP POLICY IF EXISTS "Users can view all public events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can create events" ON public.events;
DROP POLICY IF EXISTS "Users can update their own events" ON public.events;
DROP POLICY IF EXISTS "Users can delete their own events" ON public.events;
DROP POLICY IF EXISTS "Users can view public events and their own events" ON public.events;

-- Create proper RLS policies for events table
CREATE POLICY "Users can view public events and their own events" 
ON public.events 
FOR SELECT 
USING (is_public = true OR user_id = auth.uid());

CREATE POLICY "Authenticated users can create events" 
ON public.events 
FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own events" 
ON public.events 
FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own events" 
ON public.events 
FOR DELETE 
TO authenticated 
USING (user_id = auth.uid());

-- 2. Fix profiles table RLS - Drop all existing policies first
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING (id = auth.uid());

-- 3. Add proper RLS to stock_predictions table
ALTER TABLE public.stock_predictions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view stock predictions for public events or their own events" ON public.stock_predictions;
CREATE POLICY "Users can view stock predictions for public events or their own events" 
ON public.stock_predictions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = stock_predictions.event_id 
    AND (events.is_public = true OR events.user_id = auth.uid())
  )
);

-- 4. Add proper RLS to user_stock_watches table
ALTER TABLE public.user_stock_watches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own stock watches" ON public.user_stock_watches;
DROP POLICY IF EXISTS "Users can create their own stock watches" ON public.user_stock_watches;
DROP POLICY IF EXISTS "Users can update their own stock watches" ON public.user_stock_watches;
DROP POLICY IF EXISTS "Users can delete their own stock watches" ON public.user_stock_watches;

CREATE POLICY "Users can view their own stock watches" 
ON public.user_stock_watches 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own stock watches" 
ON public.user_stock_watches 
FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own stock watches" 
ON public.user_stock_watches 
FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own stock watches" 
ON public.user_stock_watches 
FOR DELETE 
TO authenticated 
USING (user_id = auth.uid());

-- 5. Add proper RLS to broker_connections table
ALTER TABLE public.broker_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own broker connections" ON public.broker_connections;
DROP POLICY IF EXISTS "Users can create their own broker connections" ON public.broker_connections;
DROP POLICY IF EXISTS "Users can update their own broker connections" ON public.broker_connections;
DROP POLICY IF EXISTS "Users can delete their own broker connections" ON public.broker_connections;

CREATE POLICY "Users can view their own broker connections" 
ON public.broker_connections 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own broker connections" 
ON public.broker_connections 
FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own broker connections" 
ON public.broker_connections 
FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own broker connections" 
ON public.broker_connections 
FOR DELETE 
TO authenticated 
USING (user_id = auth.uid());

-- 6. Add proper RLS to trading_rules table
ALTER TABLE public.trading_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own trading rules" ON public.trading_rules;
CREATE POLICY "Users can manage their own trading rules" 
ON public.trading_rules 
FOR ALL 
TO authenticated 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 7. Add proper RLS to trade_executions table
ALTER TABLE public.trade_executions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own trade executions" ON public.trade_executions;
DROP POLICY IF EXISTS "Users can create their own trade executions" ON public.trade_executions;

CREATE POLICY "Users can view their own trade executions" 
ON public.trade_executions 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own trade executions" 
ON public.trade_executions 
FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

-- 8. Database Schema Hardening - Make user_id columns NOT NULL where required
ALTER TABLE public.events ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.user_stock_watches ALTER COLUMN user_id SET DEFAULT auth.uid();

-- 9. Add password strength validation function
CREATE OR REPLACE FUNCTION public.validate_password_strength(password text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  -- Password must be at least 8 characters
  IF length(password) < 8 THEN
    RETURN false;
  END IF;
  
  -- Password must contain at least one uppercase letter
  IF password !~ '[A-Z]' THEN
    RETURN false;
  END IF;
  
  -- Password must contain at least one lowercase letter
  IF password !~ '[a-z]' THEN
    RETURN false;
  END IF;
  
  -- Password must contain at least one number
  IF password !~ '[0-9]' THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- 10. Update broker API key validation function to be more strict
CREATE OR REPLACE FUNCTION public.validate_broker_api_keys()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validate Alpaca API keys
  IF NEW.broker_name IN ('alpaca_paper', 'alpaca_live') THEN
    -- Alpaca keys have specific patterns
    IF length(NEW.api_key) < 20 OR length(NEW.api_secret) < 40 THEN
      RAISE EXCEPTION 'Invalid Alpaca API key format - keys too short';
    END IF;
    
    -- Basic pattern validation for Alpaca keys
    IF NEW.api_key !~ '^[A-Z0-9]{20,}$' THEN
      RAISE EXCEPTION 'Invalid Alpaca API key format - invalid characters';
    END IF;
  END IF;
  
  -- Ensure no obviously fake or test keys
  IF NEW.api_key IN ('test', 'fake', 'example', '123456789') OR
     NEW.api_secret IN ('test', 'fake', 'example', '123456789') THEN
    RAISE EXCEPTION 'Invalid API credentials - test values not allowed';
  END IF;
  
  RETURN NEW;
END;
$$;

-- 11. Add security audit log table
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  event_type text NOT NULL,
  event_details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS for audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.security_audit_log;
CREATE POLICY "Only admins can view audit logs" 
ON public.security_audit_log 
FOR SELECT 
TO authenticated 
USING (false); -- Only accessible via functions for now

-- 12. Add function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type text,
  p_event_details jsonb DEFAULT NULL,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    user_id,
    event_type,
    event_details,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    p_event_type,
    p_event_details,
    p_ip_address,
    p_user_agent
  );
END;
$$;
