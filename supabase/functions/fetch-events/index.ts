
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GDACSEvent {
  title: string;
  description: string;
  link: string;
  point: {
    lat: string;
    lon: string;
  };
  alertlevel: string;
  country: {
    name: string;
  };
}

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  source: {
    name: string;
  };
  publishedAt: string;
  content: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch natural disaster events from GDACS
    await fetchGDACSEvents(supabaseClient);
    
    // Fetch general news events
    await fetchNewsEvents(supabaseClient);

    return new Response(
      JSON.stringify({ message: 'Events fetched and processed successfully' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

async function fetchGDACSEvents(supabaseClient) {
  // Fetch data from GDACS RSS feed
  const response = await fetch('https://www.gdacs.org/xml/rss.xml');
  const text = await response.text();
  
  // Parse XML to JSON
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(text, "text/xml");
  const items = xmlDoc.getElementsByTagName("item");

  console.log(`Processing ${items.length} GDACS events`);

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const event: GDACSEvent = {
      title: item.getElementsByTagName("title")[0]?.textContent ?? '',
      description: item.getElementsByTagName("description")[0]?.textContent ?? '',
      link: item.getElementsByTagName("link")[0]?.textContent ?? '',
      point: {
        lat: item.getElementsByTagName("geo:lat")[0]?.textContent ?? '',
        lon: item.getElementsByTagName("geo:long")[0]?.textContent ?? '',
      },
      alertlevel: item.getElementsByTagName("gdacs:alertlevel")[0]?.textContent ?? '',
      country: {
        name: item.getElementsByTagName("gdacs:country")[0]?.textContent ?? '',
      },
    };

    // Map GDACS alert level to our severity levels
    let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    switch (event.alertlevel) {
      case 'Red':
        severity = 'CRITICAL';
        break;
      case 'Orange':
        severity = 'HIGH';
        break;
      case 'Green':
        severity = 'LOW';
        break;
      default:
        severity = 'MEDIUM';
    }

    // Insert into Supabase
    const { error } = await supabaseClient
      .from('events')
      .upsert({
        title: event.title,
        description: event.description,
        event_type: 'NATURAL_DISASTER',
        severity: severity,
        country: event.country.name,
        latitude: parseFloat(event.point.lat),
        longitude: parseFloat(event.point.lon),
        source_url: event.link,
        source_api: 'GDACS',
      }, {
        onConflict: 'title'
      });

    if (error) {
      console.error('Error inserting GDACS event:', error);
    }
  }
}

async function fetchNewsEvents(supabaseClient) {
  const NEWS_API_KEY = Deno.env.get('NEWS_API_KEY');
  
  if (!NEWS_API_KEY) {
    console.warn('NEWS_API_KEY not set, skipping news events fetch');
    return;
  }
  
  try {
    // Fetch top business and geopolitical news
    const categories = ['business', 'politics', 'technology'];
    
    for (const category of categories) {
      const url = `https://newsapi.org/v2/top-headlines?category=${category}&language=en&apiKey=${NEWS_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status !== 'ok') {
        console.error(`Error fetching news for category ${category}:`, data.message);
        continue;
      }
      
      console.log(`Processing ${data.articles.length} news articles for category: ${category}`);
      
      for (const article of data.articles) {
        if (!article.title || !article.description) continue;
        
        // Map news categories to our event types
        let eventType: 'NATURAL_DISASTER' | 'GEOPOLITICAL' | 'ECONOMIC' | 'OTHER';
        if (category === 'business') {
          eventType = 'ECONOMIC';
        } else if (category === 'politics') {
          eventType = 'GEOPOLITICAL';
        } else {
          eventType = 'OTHER';
        }
        
        // Determine severity based on content analysis (basic implementation)
        // In a real app, this would use more sophisticated NLP
        const content = (article.content || article.description || '').toLowerCase();
        const highImpactWords = ['crisis', 'emergency', 'disaster', 'catastrophe', 'collapse', 'crash'];
        const mediumImpactWords = ['decline', 'drop', 'fall', 'conflict', 'dispute', 'tension'];
        
        let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
        
        if (highImpactWords.some(word => content.includes(word))) {
          severity = 'HIGH';
        } else if (mediumImpactWords.some(word => content.includes(word))) {
          severity = 'MEDIUM';
        }
        
        // Extract country (simple implementation)
        const mainCountries = [
          'USA', 'United States', 'China', 'Russia', 'UK', 'India', 'Japan', 
          'Germany', 'France', 'Brazil', 'Canada', 'Australia', 'Italy'
        ];
        
        let country = null;
        for (const c of mainCountries) {
          if (article.title.includes(c) || article.description.includes(c)) {
            country = c;
            break;
          }
        }
        
        // Insert into Supabase
        const { error } = await supabaseClient
          .from('events')
          .upsert({
            title: article.title,
            description: article.description,
            event_type: eventType,
            severity: severity,
            country: country,
            source_url: article.url,
            source_api: 'NewsAPI',
          }, {
            onConflict: 'title'
          });
        
        if (error) {
          console.error('Error inserting news event:', error);
        }
      }
    }
  } catch (error) {
    console.error('Error in fetchNewsEvents:', error);
  }
}
