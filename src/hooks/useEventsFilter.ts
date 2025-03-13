
import { useMemo } from "react";
import type { Event, EventType, SeverityLevel } from "@/types/event";

/**
 * Custom hook for filtering events based on type, severity, and search term
 */
export const useEventsFilter = (
  events: Event[] = [],
  eventType: EventType | "ALL",
  searchTerm: string
) => {
  return useMemo(() => {
    return (events || []).filter(event => {
      if (eventType !== "ALL" && event.event_type !== eventType) {
        return false;
      }
      
      if (searchTerm.trim() !== "") {
        const searchLower = searchTerm.toLowerCase();
        
        const titleMatch = event.title?.toLowerCase().includes(searchLower) || false;
        const descriptionMatch = event.description?.toLowerCase().includes(searchLower) || false;
        const countryMatch = event.country?.toLowerCase().includes(searchLower) || false;
        const cityMatch = event.city?.toLowerCase().includes(searchLower) || false;
        
        if (!titleMatch && !descriptionMatch && !countryMatch && !cityMatch) {
          return false;
        }
      }
      
      return true;
    });
  }, [events, eventType, searchTerm]);
};
