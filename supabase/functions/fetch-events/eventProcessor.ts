import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { determineEventType, determineSeverity, validateEventClassification } from "./eventClassifier.ts";
import type { StandardizedArticle } from "./types.ts";

/**
 * Processes an array of articles and creates events in the database
 */
export async function processArticles(
  articles: StandardizedArticle[], 
  supabaseClient: ReturnType<typeof createClient>
): Promise<{ createdCount: number; skippedCount: number }> {
  let createdCount = 0;
  let skippedCount = 0;

  for (const article of articles) {
    try {
      if (!article.title || !article.description) {
        console.log('Skipping article with missing title or description');
        skippedCount++;
        continue;
      }

      // Check if an event with this title already exists
      const { data: existingEvents } = await supabaseClient
        .from('events')
        .select('id')
        .eq('title', article.title)
        .limit(1);

      if (existingEvents && existingEvents.length > 0) {
        console.log(`Event already exists for article: ${article.title}`);
        skippedCount++;
        continue;
      }

      const eventType = determineEventType(article.title, article.description);
      const severity = determineSeverity(article.title, article.description);
      
      // Skip creating low and medium impact events entirely
      if (severity === 'LOW' || severity === 'MEDIUM') {
        console.log(`Skipping ${severity.toLowerCase()} impact event: ${article.title}`);
        skippedCount++;
        continue;
      }

      // Create new event
      const { error: insertError } = await supabaseClient
        .from('events')
        .insert([{
          title: article.title,
          description: article.description,
          event_type: eventType,
          severity: severity,
          is_public: true,
          source_url: article.url,
          source_api: article.source_api,
          created_at: new Date().toISOString() // Use current time to ensure it's recent
        }]);

      if (insertError) {
        console.error(`Error creating event for article: ${article.title}`, insertError);
        skippedCount++;
        continue;
      }

      createdCount++;
      console.log(`Created new event from article: ${article.title} (${article.source_api})`);
    } catch (error) {
      console.error('Error processing article:', error);
      skippedCount++;
      continue;
    }
  }

  return { createdCount, skippedCount };
}

/**
 * Cleans old events from the database when forcing a refresh
 */
export async function cleanOldEvents(
  forceRefresh: boolean,
  supabaseClient: ReturnType<typeof createClient>
): Promise<number> {
  if (!forceRefresh) {
    return 0;
  }
  
  const tenMinutesAgo = new Date();
  tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);
  
  // Delete public events older than 10 minutes if forcing a refresh
  // Only delete events that came from API sources (not user-created ones)
  const { error: deleteError, count } = await supabaseClient
    .from('events')
    .delete()
    .eq('is_public', true)
    .in('source_api', ['NEWS_API', 'FINNHUB_API'])
    .lt('created_at', tenMinutesAgo.toISOString());
  
  if (deleteError) {
    console.error('Error cleaning old events:', deleteError);
    return 0;
  } else {
    console.log(`Cleaned ${count} old events for force refresh`);
    return count || 0;
  }
}

/**
 * Processes and stores an event in the database
 */
export async function processAndStoreEvent(
  title: string,
  description: string,
  sourceUrl: string,
  sourceApi: string,
  supabase: any,
  location?: { country?: string; city?: string }
): Promise<void> {
  try {
    // Determine event type and severity using enhanced classification
    const eventType = determineEventType(title, description);
    const initialSeverity = determineSeverity(title, description);
    
    // Validate the classification - downgrade if it doesn't meet criteria
    const isValidClassification = validateEventClassification(title, description, initialSeverity);
    const severity = isValidClassification ? initialSeverity : 
      (initialSeverity === "CRITICAL" ? "HIGH" : 
       initialSeverity === "HIGH" ? "MEDIUM" : 
       initialSeverity === "MEDIUM" ? "LOW" : "LOW");
    
    console.log(`Event classified as: ${eventType} - ${severity} (original: ${initialSeverity}, valid: ${isValidClassification})`);
    
    // Skip storing LOW and MEDIUM severity events to reduce noise
    if (severity === 'LOW' || severity === 'MEDIUM') {
      console.log(`Skipping low impact event: ${title}`);
      return;
    }
    
    // Check if event already exists
    const { data: existingEvent } = await supabase
      .from('events')
      .select('id')
      .eq('title', title)
      .single();
    
    if (existingEvent) {
      console.log(`Event already exists: ${title}`);
      return;
    }
    
    // Create the event object
    const eventData = {
      title,
      description,
      event_type: eventType,
      severity,
      source_url: sourceUrl,
      source_api: sourceApi,
      country: location?.country || null,
      city: location?.city || null,
      is_public: true,
      user_id: null
    };
    
    // Insert the event
    const { data, error } = await supabase
      .from('events')
      .insert([eventData])
      .select()
      .single();
    
    if (error) {
      console.error('Error inserting event:', error);
      throw error;
    }
    
    console.log(`Successfully stored ${severity} severity event: ${title}`);
    
    // Only analyze HIGH and CRITICAL events to save API credits
    if (severity === 'HIGH' || severity === 'CRITICAL') {
      try {
        console.log(`Triggering analysis for ${severity} event: ${data.id}`);
        await supabase.functions.invoke('analyze-event', {
          body: { event_id: data.id }
        });
      } catch (analysisError) {
        console.error('Error triggering event analysis:', analysisError);
        // Don't throw - event is still stored successfully
      }
    }
    
  } catch (error) {
    console.error('Error processing event:', error);
    throw error;
  }
}
