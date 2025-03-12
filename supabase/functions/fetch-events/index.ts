
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
    // Extract request data
    const body = await req.json().catch(e => {
      console.error("Error parsing JSON:", e);
      return { source: "unknown" };
    });
    
    const source = body.source || "unknown";
    console.log(`Processing fetch-events request from source: ${source}`);

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Fetch news from News API
    const newsApiKey = Deno.env.get('NEWS_API_KEY');
    if (!newsApiKey) {
      throw new Error('NEWS_API_KEY not configured');
    }

    const newsResponse = await fetch(
      'https://newsapi.org/v2/top-headlines?country=us&pageSize=10',
      {
        headers: {
          'X-Api-Key': newsApiKey
        }
      }
    );

    if (!newsResponse.ok) {
      throw new Error(`News API error: ${newsResponse.statusText}`);
    }

    const newsData = await newsResponse.json();
    console.log(`Fetched ${newsData.articles?.length || 0} articles from News API`);

    // Process each news article and create events
    for (const article of newsData.articles || []) {
      try {
        // Check if an event with this title already exists
        const { data: existingEvents } = await supabaseClient
          .from('events')
          .select('id')
          .eq('title', article.title)
          .limit(1);

        if (existingEvents && existingEvents.length > 0) {
          console.log(`Event already exists for article: ${article.title}`);
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
            created_at: new Date(article.publishedAt).toISOString()
          }]);

        if (insertError) {
          console.error(`Error creating event for article: ${article.title}`, insertError);
          continue;
        }

        console.log(`Created new event from article: ${article.title}`);
      } catch (error) {
        console.error('Error processing article:', error);
        continue;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Events fetched and created successfully',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error) {
    console.error('Error in fetch-events function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
