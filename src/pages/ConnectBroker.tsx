
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import BrokerConnectionCard from "@/components/Broker/BrokerConnectionCard";
import BrokerConnectionDialog from "@/components/Broker/BrokerConnectionDialog";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type BrokerConnection = Database["public"]["Tables"]["broker_connections"]["Row"];

const BROKER_CONNECTIONS_KEY = "broker-connections";

const ConnectBroker = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [connectionToEdit, setConnectionToEdit] = useState<BrokerConnection | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletedConnectionIds, setDeletedConnectionIds] = useState<string[]>([]);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      }
    };
    
    checkAuth();
  }, [navigate]);

  // Fetch broker connections
  const { data: connections = [], isLoading, refetch } = useQuery({
    queryKey: [BROKER_CONNECTIONS_KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("broker_connections")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        toast({
          title: "Error fetching broker connections",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      
      console.log("Fetched connections:", data);
      return data;
    },
  });

  const handleEdit = (connection: BrokerConnection) => {
    setConnectionToEdit(connection);
    setIsDialogOpen(true);
  };

  const handleDelete = useCallback(async (connectionId: string) => {
    try {
      setIsDeleting(true);
      
      console.log("Deleting broker connection:", connectionId);
      
      const { error } = await supabase
        .from("broker_connections")
        .delete()
        .eq("id", connectionId);

      if (error) throw error;
      
      // Update local state to filter out this connection immediately
      setDeletedConnectionIds(prev => [...prev, connectionId]);
      
      // Completely remove the query from cache
      queryClient.removeQueries({ queryKey: [BROKER_CONNECTIONS_KEY] });
      
      // Force a complete refetch to ensure we have the latest data
      await refetch();
      
      toast({
        title: "Success",
        description: "Broker connection deleted successfully",
      });
      
      console.log("Broker connection deleted successfully");
    } catch (error: any) {
      toast({
        title: "Error deleting broker connection",
        description: error.message,
        variant: "destructive",
      });
      console.error("Error deleting broker connection:", error);
    } finally {
      setIsDeleting(false);
    }
  }, [queryClient, refetch, toast]);

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setConnectionToEdit(null);
      // Refetch connections when dialog closes to ensure we have the latest data
      refetch();
    }
  };

  // Filter out deleted connections from display
  const displayConnections = connections.filter(
    connection => !deletedConnectionIds.includes(connection.id)
  );

  // Every time we get new connections data, synchronize with our deletedConnectionIds
  useEffect(() => {
    if (connections.length > 0) {
      // Get all connection ids from the latest data
      const currentConnectionIds = new Set(connections.map(conn => conn.id));
      
      // Filter out deleted connection ids that no longer exist in the latest data
      setDeletedConnectionIds(prev => 
        prev.filter(id => currentConnectionIds.has(id))
      );
    }
  }, [connections]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background/90">
      <div className="container px-4 pt-24 pb-20">
        <div className="space-y-8 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground">Broker Connections</h1>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Broker
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-48 rounded-xl bg-card/40 animate-pulse"
                />
              ))
            ) : displayConnections.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center p-8 text-center bg-card/40 rounded-xl">
                <h3 className="text-xl font-semibold mb-2">No broker connections yet</h3>
                <p className="text-muted-foreground mb-4">
                  Connect your first broker to start trading automatically.
                </p>
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Broker
                </Button>
              </div>
            ) : (
              displayConnections.map((connection) => (
                <BrokerConnectionCard
                  key={connection.id}
                  connection={connection}
                  onEdit={() => handleEdit(connection)}
                  onDelete={() => handleDelete(connection.id)}
                  isDeleting={isDeleting && deletedConnectionIds.includes(connection.id)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <BrokerConnectionDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        connectionToEdit={connectionToEdit}
      />
    </div>
  );
};

export default ConnectBroker;
