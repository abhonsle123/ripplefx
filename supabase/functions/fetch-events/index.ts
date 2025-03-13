
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

type FinnhubNewsArticle = {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
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

    // Check if we need to clean the database for a force refresh
    if (forceRefresh) {
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
      } else {
        console.log(`Cleaned ${count} old events for force refresh`);
      }
    }

    // We'll collect news from multiple sources and then process them together
    let allArticles = [];
    let createdCount = 0;
    let skippedCount = 0;
    
    // 1. Fetch news from News API (existing implementation)
    try {
      const newsApiKey = Deno.env.get('NEWS_API_KEY');
      if (!newsApiKey) {
        console.error('NEWS_API_KEY not configured');
      } else {
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
          } else {
            console.error(`News API error: ${newsResponse.statusText}`);
          }
        } else {
          const newsData = await newsResponse.json();
          console.log(`Fetched ${newsData.articles?.length || 0} articles from News API for country: ${countryCode}`);
          
          if (newsData.articles && newsData.articles.length > 0) {
            // Transform News API articles to a standard format for processing
            const standardizedArticles = newsData.articles.map((article: NewsArticle) => ({
              title: article.title,
              description: article.description || article.content || 'No description available',
              url: article.url,
              source_api: 'NEWS_API'
            }));
            
            allArticles = [...allArticles, ...standardizedArticles];
          }
        }
      }
    } catch (newsApiError) {
      console.error('Error fetching from News API:', newsApiError);
      // Continue to next source even if this one fails
    }
    
    // 2. Fetch news from Finnhub API (new implementation)
    try {
      const finnhubApiKey = Deno.env.get('FINNHUB_API_KEY');
      if (!finnhubApiKey) {
        console.error('FINNHUB_API_KEY not configured');
      } else {
        // Add a timestamp parameter to avoid caching
        const timestamp = new Date().getTime();
        
        const finnhubResponse = await fetch(
          `https://finnhub.io/api/v1/news?category=general&token=${finnhubApiKey}&_t=${timestamp}`
        );

        if (!finnhubResponse.ok) {
          console.error(`Finnhub API error: ${finnhubResponse.statusText}`);
        } else {
          const finnhubData = await finnhubResponse.json();
          console.log(`Fetched ${finnhubData?.length || 0} articles from Finnhub API`);
          
          if (finnhubData && finnhubData.length > 0) {
            // Transform Finnhub articles to a standard format for processing
            const standardizedArticles = finnhubData.map((article: FinnhubNewsArticle) => ({
              title: article.headline,
              description: article.summary || 'No description available',
              url: article.url,
              source_api: 'FINNHUB_API'
            }));
            
            allArticles = [...allArticles, ...standardizedArticles];
          }
        }
      }
    } catch (finnhubApiError) {
      console.error('Error fetching from Finnhub API:', finnhubApiError);
      // Continue processing even if Finnhub API fails
    }
    
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

    // Process each article and create events
    for (const article of allArticles) {
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
