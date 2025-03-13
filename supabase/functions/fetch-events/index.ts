
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

console.log("Loading fetch-events function")

type NewsArticle = {
  title: string;
  description: string;
  source: {
    name: string;
  };
  url: string;
  publishedAt: string;
  content: string;
}

// Function to determine event type based on keywords
function determineEventType(title: string, description: string): "NATURAL_DISASTER" | "GEOPOLITICAL" | "ECONOMIC" | "OTHER" {
  const text = (title + " " + description).toLowerCase();
  
  if (text.match(/earthquake|flood|hurricane|tsunami|storm|disaster|wildfire|drought/)) {
    return "NATURAL_DISASTER";
  } else if (text.match(/war|conflict|treaty|political|election|government|military/)) {
    return "GEOPOLITICAL";
  } else if (text.match(/stock|market|economy|inflation|recession|gdp|interest rate|fed|financial/)) {
    return "ECONOMIC";
  }
  
  return "OTHER";
}

// Function to determine severity based on keywords and analysis
function determineSeverity(title: string, description: string): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
  const text = (title + " " + description).toLowerCase();
  
  if (text.match(/catastrophic|devastating|critical|emergency|crisis|severe|deadly/)) {
    return "CRITICAL";
  } else if (text.match(/major|significant|serious|dangerous|threat/)) {
    return "HIGH";
  } else if (text.match(/moderate|concerning|warning|alert/)) {
    return "MEDIUM";
  }
  
  return "LOW";
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    })
  }

  try {
    const body = await req.json().catch(e => {
      console.error("Error parsing JSON:", e);
      return { source: "unknown", forceRefresh: false };
    });
    
    const source = body.source || "unknown";
    const forceRefresh = body.forceRefresh || false;
    console.log(`Processing fetch-events request from source: ${source}, forceRefresh: ${forceRefresh}`);

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Fetch news from News API with proper error handling
    const newsApiKey = Deno.env.get('NEWS_API_KEY');
    if (!newsApiKey) {
      throw new Error('NEWS_API_KEY not configured');
    }

    // Use different country codes to get more variety of news (us, gb, ca)
    const countryCode = ["us", "gb", "ca"][Math.floor(Math.random() * 3)];
    
    // Add a timestamp parameter to avoid caching
    const timestamp = new Date().getTime();
    
    const newsResponse = await fetch(
      `https://newsapi.org/v2/top-headlines?country=${countryCode}&pageSize=10&_t=${timestamp}`,
      {
        headers: {
          'X-Api-Key': newsApiKey
        }
      }
    );

    if (!newsResponse.ok) {
      if (newsResponse.status === 429) {
        console.error('News API rate limit exceeded');
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Rate limit exceeded',
            message: 'The News API rate limit has been reached. Please try again in a few minutes.'
          }),
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      throw new Error(`News API error: ${newsResponse.statusText}`);
    }

    const newsData = await newsResponse.json();
    console.log(`Fetched ${newsData.articles?.length || 0} articles from News API for country: ${countryCode}`);

    if (!newsData.articles || newsData.articles.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No new articles to process',
          timestamp: new Date().toISOString()
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    let createdCount = 0;
    let skippedCount = 0;

    // Check if we need to clean the database for a force refresh
    if (forceRefresh) {
      const tenMinutesAgo = new Date();
      tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);
      
      // Delete public events older than 10 minutes if forcing a refresh
      // Only delete events that came from NEWS_API (not user-created ones)
      const { error: deleteError, count } = await supabaseClient
        .from('events')
        .delete()
        .eq('is_public', true)
        .eq('source_api', 'NEWS_API')
        .lt('created_at', tenMinutesAgo.toISOString());
      
      if (deleteError) {
        console.error('Error cleaning old events:', deleteError);
      } else {
        console.log(`Cleaned ${count} old events for force refresh`);
      }
    }

    // Process each news article and create events
    for (const article of newsData.articles) {
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

        const eventType = determineEventType(article.title, article.description || '');
        const severity = determineSeverity(article.title, article.description || '');

        // Create new event
        const { error: insertError } = await supabaseClient
          .from('events')
          .insert([{
            title: article.title,
            description: article.description || article.content || 'No description available',
            event_type: eventType,
            severity: severity,
            is_public: true,
            source_url: article.url,
            source_api: 'NEWS_API',
            created_at: new Date().toISOString() // Use current time to ensure it's recent
          }]);

        if (insertError) {
          console.error(`Error creating event for article: ${article.title}`, insertError);
          skippedCount++;
          continue;
        }

        createdCount++;
        console.log(`Created new event from article: ${article.title}`);
      } catch (error) {
        console.error('Error processing article:', error);
        skippedCount++;
        continue;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Events processed successfully. Created: ${createdCount}, Skipped: ${skippedCount}`,
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
    )
  }
})
