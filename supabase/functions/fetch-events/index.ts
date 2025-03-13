
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from './corsHeaders.ts';
import { fetchFromNewsApi } from './newsSources/newsApi.ts';
import { fetchFromFinnhubApi } from './newsSources/finnhubApi.ts';
import { processArticles, cleanOldEvents } from './eventProcessor.ts';
import type { RequestBody } from './types.ts';

console.log("Loading fetch-events function");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    const body = await req.json().catch(e => {
      console.error("Error parsing JSON:", e);
      return { source: "unknown", forceRefresh: false } as RequestBody;
    });
    
    const source = body.source || "unknown";
    const forceRefresh = body.forceRefresh || false;
    console.log(`Processing fetch-events request from source: ${source}, forceRefresh: ${forceRefresh}`);

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Clean old events if force refresh is requested
    const cleanedCount = await cleanOldEvents(forceRefresh, supabaseClient);

    // Fetch articles from all news sources
    const newsApiArticles = await fetchFromNewsApi();
    const finnhubArticles = await fetchFromFinnhubApi();
    
    // Combine articles from all sources
    const allArticles = [...newsApiArticles, ...finnhubArticles];
    console.log(`Processing ${allArticles.length} total articles from all sources`);
    
    if (allArticles.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No articles to process from any source',
          timestamp: new Date().toISOString()
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Process articles and create events
    const { createdCount, skippedCount } = await processArticles(allArticles, supabaseClient);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Events processed successfully. Created: ${createdCount}, Skipped: ${skippedCount}, Cleaned: ${cleanedCount}`,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error) {
    console.error('Error in fetch-events function:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = errorMessage.includes('rate limit') ? 429 : 500;
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: statusCode === 429 ? 'Rate Limit Exceeded' : 'Internal Server Error',
        message: errorMessage
      }),
      { 
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
