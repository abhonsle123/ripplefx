
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import EventCardHeader from "./EventCardHeader";
import EventCardDetails from "./EventCardDetails";
import ImpactAnalysis from "./ImpactAnalysis";

type Event = Database["public"]["Tables"]["events"]["Row"];

interface ImpactAnalysis {
  affected_sectors: string[];
  stock_predictions?: {
    positive?: string[];
    negative?: string[];
    confidence_scores?: {
      overall_prediction: number;
      sector_impact: number;
      market_direction: number;
    };
  };
  analysis_metadata?: {
    data_quality_score: number;
  };
}

interface EventCardProps {
  event: Event;
  userPreferences?: {
    industries?: string[];
    companies?: string[];
    event_types?: string[];
  };
}

const EventCard = ({ event, userPreferences }: EventCardProps) => {
  const { data: analysis, isLoading } = useQuery({
    queryKey: ['eventAnalysis', event.id],
    queryFn: async () => {
      if (!event.impact_analysis) {
        const { data, error } = await supabase.functions.invoke('analyze-event', {
          body: { event_id: event.id }
        });
        if (error) throw error;
        return data.analysis as unknown as ImpactAnalysis;
      }
      return event.impact_analysis as unknown as ImpactAnalysis;
    },
    enabled: !event.impact_analysis,
  });

  const impactAnalysis = event.impact_analysis 
    ? (event.impact_analysis as unknown as ImpactAnalysis) 
    : analysis;

  const isRelevantToUser = () => {
    if (!userPreferences) return false;

    const eventTypeMatch = userPreferences.event_types?.includes(event.event_type);

    const companiesMatch = userPreferences.companies?.some(company => {
      if (!event.affected_organizations) return false;
      const orgs = Array.isArray(event.affected_organizations) 
        ? event.affected_organizations
        : typeof event.affected_organizations === 'object'
          ? Object.values(event.affected_organizations)
          : [];
      return orgs.some(org => 
        typeof org === 'string' && org.toLowerCase().includes(company.toLowerCase())
      );
    });

    const industriesMatch = userPreferences.industries?.some(industry => {
      if (!impactAnalysis?.affected_sectors) return false;
      return impactAnalysis.affected_sectors.some(sector =>
        sector.toLowerCase().includes(industry.toLowerCase())
      );
    });

    return eventTypeMatch || companiesMatch || industriesMatch;
  };

  const isRelevant = isRelevantToUser();

  return (
    <Card className={`h-full hover:shadow-lg transition-shadow ${isRelevant ? 'ring-2 ring-primary' : ''}`}>
      <EventCardHeader
        title={event.title}
        severity={event.severity}
        eventType={event.event_type}
        isRelevant={isRelevant}
      />
      <CardContent>
        <EventCardDetails
          description={event.description}
          city={event.city}
          country={event.country}
          createdAt={event.created_at}
          affectedOrganizations={event.affected_organizations}
        />
        
        {impactAnalysis && <ImpactAnalysis analysis={impactAnalysis} />}
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
