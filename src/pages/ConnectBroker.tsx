
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import BrokerConnectionCard from "@/components/Broker/BrokerConnectionCard";
import BrokerConnectionDialog from "@/components/Broker/BrokerConnectionDialog";
import { useToast } from "@/components/ui/use-toast";

const ConnectBroker = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Check authentication
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (!session) {
      navigate("/auth");
    }
  });

  const { data: connections = [], isLoading } = useQuery({
    queryKey: ["broker-connections"],
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
      return data;
    },
  });

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
            ) : connections.length === 0 ? (
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
              connections.map((connection) => (
                <BrokerConnectionCard
                  key={connection.id}
                  connection={connection}
                  onEdit={() => {
                    // TODO: Implement edit functionality
                    console.log("Edit connection:", connection.id);
                  }}
                  onDelete={async () => {
                    const { error } = await supabase
                      .from("broker_connections")
                      .delete()
                      .eq("id", connection.id);

                    if (error) {
                      toast({
                        title: "Error deleting broker connection",
                        description: error.message,
                        variant: "destructive",
                      });
                    } else {
                      toast({
                        title: "Broker connection deleted",
                        description: "The broker connection has been removed successfully.",
                      });
                    }
                  }}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <BrokerConnectionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
};

export default ConnectBroker;
