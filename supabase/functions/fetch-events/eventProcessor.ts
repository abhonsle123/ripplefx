
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { determineEventType, determineSeverity } from "./eventClassifier.ts";
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
