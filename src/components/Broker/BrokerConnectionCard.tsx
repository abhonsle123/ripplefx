
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Server } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type BrokerConnection = Database["public"]["Tables"]["broker_connections"]["Row"];

interface BrokerConnectionCardProps {
  connection: BrokerConnection;
  onEdit: () => void;
  onDelete: () => void;
}

const BrokerConnectionCard = ({
  connection,
  onEdit,
  onDelete,
}: BrokerConnectionCardProps) => {
  return (
    <Card className="bg-card/40 backdrop-blur-sm border-accent/10">
      <CardHeader className="flex flex-row items-center gap-4">
        <div className="p-2 rounded-lg bg-accent/20">
          <Server className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">{connection.broker_name}</h3>
          <p className="text-sm text-muted-foreground">
            Connected on{" "}
            {new Date(connection.created_at).toLocaleDateString()}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          <p>Status: Active</p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="hover:bg-accent"
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDelete}
          className="hover:bg-destructive hover:text-destructive-foreground"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BrokerConnectionCard;
