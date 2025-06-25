import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { classifyEventWithAI } from "./aiEventClassifier.ts";
import type { StandardizedArticle } from "./types.ts";

/**
 * Processes an array of articles and creates events in the database using AI classification
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

      // Use AI to classify the event
      const classification = await classifyEventWithAI(
        article.title, 
        article.description, 
        supabaseClient
      );
      
      // Skip creating low and medium impact events entirely
      if (classification.severity === 'LOW' || classification.severity === 'MEDIUM') {
        console.log(`Skipping ${classification.severity.toLowerCase()} impact event: ${article.title}`);
        skippedCount++;
        continue;
      }

      // Create new event
      const { error: insertError } = await supabaseClient
        .from('events')
        .insert([{
          title: article.title,
          description: article.description,
          event_type: classification.eventType,
          severity: classification.severity,
          is_public: true,
          source_url: article.url,
          source_api: article.source_api,
          created_at: new Date().toISOString()
        }]);

      if (insertError) {
        console.error(`Error creating event for article: ${article.title}`, insertError);
        skippedCount++;
        continue;
      }

      createdCount++;
      console.log(`Created new event from article: ${article.title} (${article.source_api}) - AI classified as ${classification.severity} with ${classification.confidence} confidence`);
      
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
 * Processes and stores an event in the database using AI classification
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
    // Use AI to classify the event
    const classification = await classifyEventWithAI(title, description, supabase);
    
    console.log(`Event classified with AI as: ${classification.eventType} - ${classification.severity} (confidence: ${classification.confidence})`);
    
    // Skip storing LOW and MEDIUM severity events to reduce noise
    if (classification.severity === 'LOW' || classification.severity === 'MEDIUM') {
      console.log(`Skipping ${classification.severity.toLowerCase()} impact event: ${title}`);
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
      event_type: classification.eventType,
      severity: classification.severity,
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
    
    console.log(`Successfully stored ${classification.severity} severity event: ${title} (AI confidence: ${classification.confidence})`);
    
    // Only analyze HIGH and CRITICAL events to save API credits
    if (classification.severity === 'HIGH' || classification.severity === 'CRITICAL') {
      try {
        console.log(`Triggering analysis for ${classification.severity} event: ${data.id}`);
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
