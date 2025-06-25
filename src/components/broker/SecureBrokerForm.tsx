
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSecurityAudit } from "@/hooks/useSecurityAudit";
import { useRateLimit } from "@/hooks/useRateLimit";
import { alpacaApiKeySchema, alpacaSecretSchema } from "@/lib/validation";

const SecureBrokerForm = () => {
  const [formData, setFormData] = useState({
    broker_name: '',
    api_key: '',
    api_secret: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { logBrokerConnection } = useSecurityAudit();
  const { recordAttempt, isRateLimited, getRemainingTime } = useRateLimit('FORM_SUBMISSIONS');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isRateLimited()) {
      toast.error(`Rate limit exceeded. Try again in ${Math.ceil(getRemainingTime() / 1000)} seconds`);
      return;
    }

    if (!recordAttempt()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Validate API credentials
      if (formData.broker_name.includes('alpaca')) {
        try {
          alpacaApiKeySchema.parse(formData.api_key);
          alpacaSecretSchema.parse(formData.api_secret);
        } catch (error) {
          toast.error('Invalid API credentials format');
          return;
        }
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to continue');
        return;
      }

      // Insert the broker connection with user_id
      const { error } = await supabase
        .from('broker_connections')
        .insert({
          broker_name: formData.broker_name as "alpaca_paper" | "alpaca_live",
          api_key: formData.api_key,
          api_secret: formData.api_secret,
          user_id: user.id,
          is_active: true
        });

      if (error) {
        console.error('Error saving broker connection:', error);
        toast.error('Failed to save broker connection');
        logBrokerConnection(formData.broker_name, false);
        return;
      }

      toast.success('Broker connection saved successfully');
      logBrokerConnection(formData.broker_name, true);
      
      // Reset form
      setFormData({
        broker_name: '',
        api_key: '',
        api_secret: ''
      });

    } catch (error) {
      console.error('Broker connection error:', error);
      toast.error('An error occurred while saving broker connection');
      logBrokerConnection(formData.broker_name, false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Connect Broker Account</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="broker_name">Broker</Label>
            <Select 
              value={formData.broker_name} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, broker_name: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select broker" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alpaca_paper">Alpaca (Paper Trading)</SelectItem>
                <SelectItem value="alpaca_live">Alpaca (Live Trading)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="api_key">API Key</Label>
            <Input
              id="api_key"
              type="password"
              value={formData.api_key}
              onChange={(e) => setFormData(prev => ({ ...prev, api_key: e.target.value }))}
              placeholder="Enter your API key"
              required
            />
          </div>

          <div>
            <Label htmlFor="api_secret">API Secret</Label>
            <Input
              id="api_secret"
              type="password"
              value={formData.api_secret}
              onChange={(e) => setFormData(prev => ({ ...prev, api_secret: e.target.value }))}
              placeholder="Enter your API secret"
              required
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting || !formData.broker_name || !formData.api_key || !formData.api_secret}
          >
            {isSubmitting ? 'Connecting...' : 'Connect Broker'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SecureBrokerForm;
