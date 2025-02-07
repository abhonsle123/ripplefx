
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, ExternalLink, AlertCircle } from "lucide-react";
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex flex-col gap-2">
          <h3 className="font-semibold text-lg">{event.title}</h3>
          <div className="flex gap-2">
            <Badge className={`${getSeverityColor(event.severity)}`}>
              {event.severity.toLowerCase()}
            </Badge>
            <Badge variant="outline">
              {formatEventType(event.event_type)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{event.description}</p>
        
        <div className="space-y-2">
          {(event.city || event.country) && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4" />
              <span>
                {[event.city, event.country].filter(Boolean).join(', ')}
              </span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(event.created_at)}</span>
          </div>

          {event.affected_organizations && (
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>Affected Organizations: {
                Array.isArray(event.affected_organizations) 
                  ? event.affected_organizations.join(', ')
                  : typeof event.affected_organizations === 'object'
                    ? Object.values(event.affected_organizations).join(', ')
                    : event.affected_organizations
              }</span>
            </div>
          )}
        </div>
      </CardContent>
      {event.source_url && (
        <CardFooter>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => window.open(event.source_url, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Source
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default EventCard;
