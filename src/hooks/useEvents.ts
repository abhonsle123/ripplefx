
import { useRef } from "react";
import type { Event, EventType, SeverityLevel } from "@/types/event";
import { useEventsQuery } from "./useEventsQuery";
import { useEventsFilter } from "./useEventsFilter";
import { useEventsRefresh } from "./useEventsRefresh";
import { useTimeUtils } from "./useTimeUtils";

export const useEvents = (
  eventType: EventType | "ALL", 
  severity: SeverityLevel | "ALL", 
  searchTerm: string
) => {
  const errorNotificationShown = useRef(false);
  
  // Query events from database
  const { data: events = [], isLoading, refetch } = useEventsQuery(severity, errorNotificationShown);
  
  // Handle events refresh logic
  const { refreshEvents, isRefreshingManually, lastRefreshed, refreshInProgress } = useEventsRefresh(refetch);
  
  // Filter events based on criteria
  const filteredEvents = useEventsFilter(events, eventType, searchTerm);
  
  // Get time-related utility functions
  const { getTimeSinceLastRefresh } = useTimeUtils(lastRefreshed);

  return {
    events,
    filteredEvents,
    isLoading,
    refreshEvents,
    isRefreshingManually,
    lastRefreshed,
    timeSinceLastRefresh: getTimeSinceLastRefresh()
  };
};
