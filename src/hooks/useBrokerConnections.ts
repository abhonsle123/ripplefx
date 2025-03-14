
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BrokerConnection } from "@/types/broker";

export const useBrokerConnections = (userId: string | null) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [brokerConnections, setBrokerConnections] = useState<BrokerConnection[]>([]);
  
  // Use localStorage to persistently track deleted IDs across page navigations
  const getDeletedIds = useCallback(() => {
    try {
      const storedIds = localStorage.getItem('deletedBrokerIds');
      return storedIds ? JSON.parse(storedIds) : [];
    } catch (e) {
      console.error('Error parsing deleted broker IDs from localStorage:', e);
      return [];
    }
  }, []);
  
  const addDeletedId = useCallback((id: string) => {
    try {
      const currentIds = getDeletedIds();
      const updatedIds = [...currentIds, id];
      localStorage.setItem('deletedBrokerIds', JSON.stringify(updatedIds));
    } catch (e) {
      console.error('Error saving deleted broker ID to localStorage:', e);
    }
  }, [getDeletedIds]);
  
  const clearDeletedIds = useCallback(() => {
    localStorage.removeItem('deletedBrokerIds');
  }, []);

  // Memoize the fetchBrokerConnections function
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
      
      // Filter out any brokers that have been deleted (tracked in localStorage)
      const deletedIds = getDeletedIds();
      const filteredData = (data || []).filter(
        connection => !deletedIds.includes(connection.id)
      );
      
      setBrokerConnections(filteredData);
    } catch (error: any) {
      console.error('Error fetching broker connections:', error);
      toast.error('Failed to load broker connections');
    } finally {
      setIsLoading(false);
    }
  }, [userId, getDeletedIds]);

  // Fetch broker connections when userId changes
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
      
      // First, aggressively clean up any existing connections with the same broker name
      // This is a critical step to ensure no duplicate connections exist
      
      console.log(`Cleaning up existing ${formData.broker_name} connections...`);
      
      // 1. Delete from the database directly - don't rely on any checks
      const { error: deleteError } = await supabase
        .from('broker_connections')
        .delete()
        .eq('user_id', userId)
        .eq('broker_name', formData.broker_name);
        
      if (deleteError) {
        console.error('Error removing existing broker connection from DB:', deleteError);
        // Continue anyway - we still want to try to add the new connection
      }
      
      // 2. Clear all localStorage data related to deleted brokers
      clearDeletedIds();
      
      console.log(`Creating new ${formData.broker_name} connection...`);
      
      // 3. Now try to insert the new broker connection
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
      
      if (error) {
        console.error('Error inserting new broker connection:', error);
        // Improved error handling with more details
        if (error.message.includes('duplicate key') || error.code === '23505') {
          throw new Error(`Unable to add connection: A connection for ${formData.broker_name === 'alpaca_paper' ? 'Alpaca Paper Trading' : 'Alpaca Live Trading'} already exists in the database. Please try again after refreshing the page.`);
        }
        throw error;
      }
      
      // 4. If successful, deactivate other connections
      if (data) {
        await supabase
          .from('broker_connections')
          .update({ is_active: false })
          .eq('user_id', userId)
          .neq('id', data.id);
      }
      
      toast.success('Broker connected successfully');
      
      // 5. Refresh the broker connections list to ensure UI is in sync
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
      // 1. Optimistically update the UI
      setBrokerConnections(prevConnections => 
        prevConnections.filter(connection => connection.id !== id)
      );
      
      // 2. Store the ID being deleted in localStorage for persistent tracking
      addDeletedId(id);
      
      // 3. Get the broker info before deletion to show in the message
      const connectionToDelete = brokerConnections.find(conn => conn.id === id);
      const brokerType = connectionToDelete?.broker_name === 'alpaca_paper' 
        ? 'Alpaca Paper Trading' 
        : 'Alpaca Live Trading';
      
      // 4. Perform the actual deletion in the database
      const { error } = await supabase
        .from('broker_connections')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Database deletion error:', error);
        throw error;
      }
      
      toast.success(`${brokerType} connection deleted`);
    } catch (error: any) {
      console.error('Error deleting broker connection:', error);
      toast.error('Failed to delete broker connection');
      
      // Refresh to ensure UI is in sync with backend
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
