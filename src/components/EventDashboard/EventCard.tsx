
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, ExternalLink, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Event = Database["public"]["Tables"]["events"]["Row"];

interface EventCardProps {
  event: Event;
}

const EventCard = ({ event }: EventCardProps) => {
  const { data: analysis, isLoading } = useQuery({
    queryKey: ['eventAnalysis', event.id],
    queryFn: async () => {
      if (!event.impact_analysis) {
        const { data, error } = await supabase.functions.invoke('analyze-event', {
          body: { event_id: event.id }
        });
        if (error) throw error;
        return data.analysis;
      }
      return event.impact_analysis;
    },
    enabled: !event.impact_analysis,
  });

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

  const impactAnalysis = event.impact_analysis || analysis;

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

          {impactAnalysis && (
            <div className="mt-4 space-y-2 border-t pt-4">
              <h4 className="font-semibold text-sm mb-2">Market Impact Analysis</h4>
              
              {impactAnalysis.affected_sectors && (
                <div className="text-sm">
                  <span className="font-medium">Affected Sectors:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {impactAnalysis.affected_sectors.map((sector: string) => (
                      <Badge key={sector} variant="secondary" className="text-xs">
                        {sector}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {impactAnalysis.stock_predictions && (
                <div className="flex gap-4 mt-2">
                  {impactAnalysis.stock_predictions.positive && (
                    <div className="flex-1">
                      <div className="flex items-center gap-1 text-sm text-green-600">
                        <TrendingUp className="h-4 w-4" />
                        <span className="font-medium">Positive Impact</span>
                      </div>
                      <ul className="text-xs mt-1 list-disc list-inside">
                        {impactAnalysis.stock_predictions.positive.slice(0, 3).map((stock: string) => (
                          <li key={stock}>{stock}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {impactAnalysis.stock_predictions.negative && (
                    <div className="flex-1">
                      <div className="flex items-center gap-1 text-sm text-red-600">
                        <TrendingDown className="h-4 w-4" />
                        <span className="font-medium">Negative Impact</span>
                      </div>
                      <ul className="text-xs mt-1 list-disc list-inside">
                        {impactAnalysis.stock_predictions.negative.slice(0, 3).map((stock: string) => (
                          <li key={stock}>{stock}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
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
