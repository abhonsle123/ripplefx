
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/integrations/supabase/types";

type Event = Database["public"]["Tables"]["events"]["Row"];

interface EventCardProps {
  event: Event;
}

const EventCard = ({ event }: EventCardProps) => {
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      default:
        return 'bg-blue-500';
    }
  };

  const formatEventType = (type: string) => {
    return type.replace('_', ' ').toLowerCase();
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="font-semibold text-lg">{event.title}</h3>
        <Badge className={`${getSeverityColor(event.severity)}`}>
          {event.severity.toLowerCase()}
        </Badge>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">
            {formatEventType(event.event_type)}
          </Badge>
          {event.city && (
            <Badge variant="outline">
              {event.city}, {event.country}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EventCard;
