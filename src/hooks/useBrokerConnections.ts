
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BrokerConnection } from "@/types/broker";

export const useBrokerConnections = (userId: string | null) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [brokerConnections, setBrokerConnections] = useState<BrokerConnection[]>([]);
  const [lastDeletedId, setLastDeletedId] = useState<string | null>(null);

  // Memoize the fetchBrokerConnections function to avoid unnecessary re-renders
  const fetchBrokerConnections = useCallback(async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('broker_connections')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Apply any pending deletions to ensure consistency
      let filteredData = data || [];
      if (lastDeletedId) {
        filteredData = filteredData.filter(connection => connection.id !== lastDeletedId);
      }
      
      setBrokerConnections(filteredData);
    } catch (error: any) {
      console.error('Error fetching broker connections:', error);
      toast.error('Failed to load broker connections');
    } finally {
      setIsLoading(false);
    }
  }, [userId, lastDeletedId]);

  // Fetch broker connections when userId changes or lastDeletedId changes
  useEffect(() => {
    if (!userId) return;
    fetchBrokerConnections();
  }, [userId, fetchBrokerConnections]);

  const addBrokerConnection = async (formData: {
    broker_name: string;
    api_key: string;
    api_secret: string;
  }) => {
    if (!userId) {
      toast.error('You must be logged in to connect a broker');
      return false;
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
      
      // Reset the lastDeletedId when adding a new connection
      setLastDeletedId(null);
      
      // Refresh the broker connections list after adding a new one
      await fetchBrokerConnections();
      return true;
    } catch (error: any) {
      console.error('Error connecting broker:', error);
      toast.error(error.message || 'Failed to connect broker');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteBrokerConnection = async (id: string) => {
    if (!confirm('Are you sure you want to delete this broker connection?')) return;
    
    try {
      // Store the ID being deleted for tracking
      setLastDeletedId(id);
      
      // Optimistically update the UI
      setBrokerConnections(prevConnections => 
        prevConnections.filter(connection => connection.id !== id)
      );
      
      // Then perform the actual deletion
      const { error } = await supabase
        .from('broker_connections')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Broker connection deleted');
    } catch (error: any) {
      console.error('Error deleting broker connection:', error);
      toast.error('Failed to delete broker connection');
      
      // Only clear lastDeletedId on error and refresh from server
      setLastDeletedId(null);
      fetchBrokerConnections();
    }
  };

  const setActiveBroker = async (id: string) => {
    try {
      // Optimistically update UI
      setBrokerConnections(prevConnections => 
        prevConnections.map(connection => ({
          ...connection,
          is_active: connection.id === id
        }))
      );
      
      // Update database
      await supabase
        .from('broker_connections')
        .update({ is_active: false })
        .eq('user_id', userId);
      
      const { error } = await supabase
        .from('broker_connections')
        .update({ is_active: true })
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Broker connection activated');
    } catch (error: any) {
      console.error('Error activating broker connection:', error);
      toast.error('Failed to activate broker connection');
      
      // Refresh from server on error
      fetchBrokerConnections();
    }
  };

  return {
    brokerConnections,
    isLoading,
    isSaving,
    fetchBrokerConnections,
    addBrokerConnection,
    deleteBrokerConnection,
    setActiveBroker
  };
};
