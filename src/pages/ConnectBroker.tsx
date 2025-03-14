
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthentication } from "@/hooks/useAuthentication";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Loader2, AlertCircle, CheckCircle, Trash } from "lucide-react";

interface BrokerConnection {
  id: string;
  broker_name: string;
  api_key: string;
  api_secret: string;
  is_active: boolean;
  created_at: string;
}

const ConnectBroker = () => {
  const { userId } = useAuthentication();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [brokerConnections, setBrokerConnections] = useState<BrokerConnection[]>([]);
  const [formData, setFormData] = useState({
    broker_name: "alpaca_paper",
    api_key: "",
    api_secret: "",
  });

  useEffect(() => {
    if (!userId) return;
    fetchBrokerConnections();
  }, [userId]);

  const fetchBrokerConnections = async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('broker_connections')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBrokerConnections(data || []);
    } catch (error: any) {
      console.error('Error fetching broker connections:', error);
      toast.error('Failed to load broker connections');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, broker_name: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      toast.error('You must be logged in to connect a broker');
      navigate('/auth');
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Basic validation
      if (!formData.api_key || !formData.api_secret) {
        throw new Error('API Key and Secret are required');
      }
      
      // Insert the new broker connection
      const { data, error } = await supabase
        .from('broker_connections')
        .insert([
          {
            user_id: userId,
            broker_name: formData.broker_name,
            api_key: formData.api_key,
            api_secret: formData.api_secret,
            is_active: true
          }
        ])
        .select()
        .single();
      
      if (error) throw error;
      
      // Deactivate other connections
      if (data) {
        await supabase
          .from('broker_connections')
          .update({ is_active: false })
          .eq('user_id', userId)
          .neq('id', data.id);
      }
      
      toast.success('Broker connected successfully');
      setFormData({
        broker_name: "alpaca_paper",
        api_key: "",
        api_secret: "",
      });
      
      // Refresh the broker connections list after adding a new one
      await fetchBrokerConnections();
      
    } catch (error: any) {
      console.error('Error connecting broker:', error);
      toast.error(error.message || 'Failed to connect broker');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this broker connection?')) return;
    
    try {
      // First optimistically update the UI
      setBrokerConnections(prevConnections => 
        prevConnections.filter(connection => connection.id !== id)
      );
      
      // Then perform the actual deletion
      const { error } = await supabase
        .from('broker_connections')
        .delete()
        .eq('id', id);
      
      if (error) {
        // If there was an error, revert the UI update by fetching the connections again
        fetchBrokerConnections();
        throw error;
      }
      
      toast.success('Broker connection deleted');
    } catch (error: any) {
      console.error('Error deleting broker connection:', error);
      toast.error('Failed to delete broker connection');
    }
  };

  const setActive = async (id: string) => {
    try {
      // Optimistically update UI first
      setBrokerConnections(prevConnections => 
        prevConnections.map(connection => ({
          ...connection,
          is_active: connection.id === id
        }))
      );
      
      // Set all connections to inactive
      await supabase
        .from('broker_connections')
        .update({ is_active: false })
        .eq('user_id', userId);
      
      // Set the selected connection to active
      const { error } = await supabase
        .from('broker_connections')
        .update({ is_active: true })
        .eq('id', id);
      
      if (error) {
        // If there was an error, revert the UI update by fetching the connections again
        fetchBrokerConnections();
        throw error;
      }
      
      toast.success('Broker connection activated');
    } catch (error: any) {
      console.error('Error activating broker connection:', error);
      toast.error('Failed to activate broker connection');
    }
  };

  return (
    <div className="container px-4 pt-24 pb-20">
      <h1 className="text-3xl font-bold mb-8">Connect Broker</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Form to add new broker */}
        <Card>
          <CardHeader>
            <CardTitle>Add New Broker Connection</CardTitle>
            <CardDescription>
              Connect your brokerage account to enable trading directly from RippleEffect
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="broker_name">Broker</Label>
                <Select 
                  value={formData.broker_name} 
                  onValueChange={handleSelectChange}
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

              <div className="space-y-2">
                <Label htmlFor="api_key">API Key</Label>
                <Input
                  id="api_key"
                  name="api_key"
                  value={formData.api_key}
                  onChange={handleInputChange}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  You can find your API key in your Alpaca dashboard
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="api_secret">API Secret</Label>
                <Input
                  id="api_secret"
                  name="api_secret"
                  type="password"
                  value={formData.api_secret}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect Broker'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* List of existing connections */}
        <Card>
          <CardHeader>
            <CardTitle>Your Broker Connections</CardTitle>
            <CardDescription>
              Manage your connected brokerage accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : brokerConnections.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  You don't have any broker connections yet.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add one to start trading directly from RippleEffect.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {brokerConnections.map((connection) => (
                  <div 
                    key={connection.id}
                    className={`p-4 rounded-lg border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                      connection.is_active ? 'bg-primary/5 border-primary/20' : ''
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">
                          {connection.broker_name === 'alpaca_paper' 
                            ? 'Alpaca (Paper Trading)' 
                            : 'Alpaca (Live Trading)'}
                        </h3>
                        {connection.is_active && (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Key: {connection.api_key.substring(0, 5)}...
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Connected: {new Date(connection.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      {!connection.is_active && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => setActive(connection.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Set Active
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleDelete(connection.id)}
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 bg-card/40 backdrop-blur-sm rounded-xl p-6 border border-accent/10">
        <h2 className="text-xl font-semibold mb-4">How to Get Your Alpaca API Keys</h2>
        <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
          <li>Go to <a href="https://app.alpaca.markets/signup" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Alpaca</a> and create an account if you don't have one.</li>
          <li>After logging in, navigate to your Paper Trading dashboard.</li>
          <li>Click on your profile icon and select "API Keys".</li>
          <li>Generate a new key pair if you don't have one.</li>
          <li>Copy the Key ID and Secret Key into the form above.</li>
          <li>Make sure to keep your Secret Key secure - it gives access to your account.</li>
        </ol>
      </div>
    </div>
  );
};

export default ConnectBroker;
