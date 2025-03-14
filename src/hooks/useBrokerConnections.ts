
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
      
      // IMPROVED APPROACH: Always check for and remove existing connections of the same broker type
      // regardless of localStorage status
      
      // Get existing connections for this broker type
      const { data: existingConnections, error: fetchError } = await supabase
        .from('broker_connections')
        .select('id, broker_name')
        .eq('user_id', userId)
        .eq('broker_name', formData.broker_name);
        
      if (fetchError) throw fetchError;
      
      // If there's an existing connection for this broker type, remove it first
      if (existingConnections && existingConnections.length > 0) {
        for (const conn of existingConnections) {
          // Delete the connection from the database
          const { error: deleteError } = await supabase
            .from('broker_connections')
            .delete()
            .eq('id', conn.id);
            
          if (deleteError) {
            console.error('Error removing existing broker connection:', deleteError);
            throw new Error('Could not add new broker connection. Please try again.');
          }
        }
        
        // Also clean up any localStorage tracking for these IDs
        const deletedIds = getDeletedIds();
        const existingIds = existingConnections.map(c => c.id);
        const newDeletedIds = deletedIds.filter(id => !existingIds.includes(id));
        localStorage.setItem('deletedBrokerIds', JSON.stringify(newDeletedIds));
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
      
      if (error) {
        // Improved error handling
        if (error.message.includes('duplicate key') || error.code === '23505') {
          throw new Error(`You already have a connection for ${formData.broker_name === 'alpaca_paper' ? 'Alpaca Paper Trading' : 'Alpaca Live Trading'}. Please delete it first.`);
        }
        throw error;
      }
      
      // Deactivate other connections
      if (data) {
        await supabase
          .from('broker_connections')
          .update({ is_active: false })
          .eq('user_id', userId)
          .neq('id', data.id);
      }
      
      toast.success('Broker connected successfully');
      
      // Clear all localStorage tracking now that we have a clean state
      clearDeletedIds();
      
      // Refresh the broker connections list
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
      // Optimistically update the UI
      setBrokerConnections(prevConnections => 
        prevConnections.filter(connection => connection.id !== id)
      );
      
      // Store the ID being deleted in localStorage for persistent tracking
      addDeletedId(id);
      
      // Perform the actual deletion in the database
      const { error } = await supabase
        .from('broker_connections')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Broker connection deleted');
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
