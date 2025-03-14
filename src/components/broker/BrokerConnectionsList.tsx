
import { AlertCircle, CheckCircle, Loader2, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { BrokerConnection } from "@/types/broker";

interface BrokerConnectionsListProps {
  connections: BrokerConnection[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  onSetActive: (id: string) => void;
}

const BrokerConnectionsList = ({
  connections,
  isLoading,
  onDelete,
  onSetActive
}: BrokerConnectionsListProps) => {
  return (
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
        ) : connections.length === 0 ? (
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
            {connections.map((connection) => (
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
                      onClick={() => onSetActive(connection.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Set Active
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1"
                    onClick={() => onDelete(connection.id)}
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
  );
};

export default BrokerConnectionsList;
