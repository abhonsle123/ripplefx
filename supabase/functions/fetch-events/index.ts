
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
    // Fetch top headlines from various categories
    const categories = ['business', 'politics', 'technology', 'health', 'science'];
    const countries = ['us', 'gb', 'ca', 'au', 'in', 'jp', 'de', 'fr'];
    
    // First, get top headlines from selected countries
    for (const country of countries) {
      const url = `https://newsapi.org/v2/top-headlines?country=${country}&pageSize=10&apiKey=${NEWS_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status !== 'ok') {
        console.error(`Error fetching news for country ${country}:`, data.message);
        continue;
      }
      
      console.log(`Processing ${data.articles.length} top headlines from ${country}`);
      await processNewsArticles(data.articles, supabaseClient);
    }
    
    // Then, get category-specific news
    for (const category of categories) {
      const url = `https://newsapi.org/v2/top-headlines?category=${category}&language=en&pageSize=10&apiKey=${NEWS_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status !== 'ok') {
        console.error(`Error fetching news for category ${category}:`, data.message);
        continue;
      }
      
      console.log(`Processing ${data.articles.length} news articles for category: ${category}`);
      await processNewsArticles(data.articles, supabaseClient, category);
    }
    
    // Finally, get everything with relevant keywords for better coverage
    const keywords = ['market', 'economy', 'crisis', 'disaster', 'innovation', 'breakthrough', 'conflict'];
    for (const keyword of keywords) {
      const url = `https://newsapi.org/v2/everything?q=${keyword}&language=en&sortBy=relevancy&pageSize=5&apiKey=${NEWS_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status !== 'ok') {
        console.error(`Error fetching news for keyword ${keyword}:`, data.message);
        continue;
      }
      
      console.log(`Processing ${data.articles.length} news articles for keyword: ${keyword}`);
      await processNewsArticles(data.articles, supabaseClient);
    }
    
  } catch (error) {
    console.error('Error in fetchNewsEvents:', error);
  }
}

async function processNewsArticles(articles, supabaseClient, category = null) {
  for (const article of articles) {
    if (!article.title || !article.description) continue;
    
    // Skip articles that are just ads or metadata
    if (article.title.toLowerCase().includes('removed') || 
        article.description.toLowerCase().includes('removed') ||
        article.title.length < 10) {
      continue;
    }
    
    // Map news categories to our event types
    let eventType: 'NATURAL_DISASTER' | 'GEOPOLITICAL' | 'ECONOMIC' | 'OTHER';
    
    if (category === 'business' || 
        article.title.toLowerCase().includes('economy') || 
        article.title.toLowerCase().includes('market') ||
        article.title.toLowerCase().includes('stock') ||
        article.title.toLowerCase().includes('financial')) {
      eventType = 'ECONOMIC';
    } else if (category === 'politics' || 
               article.title.toLowerCase().includes('government') ||
               article.title.toLowerCase().includes('president') ||
               article.title.toLowerCase().includes('minister') ||
               article.title.toLowerCase().includes('election')) {
      eventType = 'GEOPOLITICAL';
    } else if (article.title.toLowerCase().includes('disaster') ||
               article.title.toLowerCase().includes('earthquake') ||
               article.title.toLowerCase().includes('flood') ||
               article.title.toLowerCase().includes('hurricane') ||
               article.title.toLowerCase().includes('tornado')) {
      eventType = 'NATURAL_DISASTER';
    } else {
      eventType = 'OTHER';
    }
    
    // Determine severity based on content analysis
    const content = (article.title + ' ' + article.description).toLowerCase();
    const highImpactWords = ['crisis', 'emergency', 'disaster', 'catastrophe', 'collapse', 'crash', 'plunge', 'surge'];
    const mediumImpactWords = ['decline', 'drop', 'fall', 'conflict', 'dispute', 'tension', 'rise', 'increase'];
    
    let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    
    if (highImpactWords.some(word => content.includes(word))) {
      severity = 'HIGH';
    } else if (mediumImpactWords.some(word => content.includes(word))) {
      severity = 'MEDIUM';
    }
    
    // Extract country from article
    let country = null;
    const mainCountries = [
      'USA', 'United States', 'China', 'Russia', 'UK', 'United Kingdom', 'India', 'Japan', 
      'Germany', 'France', 'Brazil', 'Canada', 'Australia', 'Italy', 'Spain'
    ];
    
    for (const c of mainCountries) {
      if (content.includes(c.toLowerCase())) {
        country = c;
        break;
      }
    }
    
    // Extract affected organizations/companies
    const companyKeywords = ['company', 'corporation', 'inc', 'corp', 'ltd', 'llc'];
    let affectedOrganizations = [];
    
    // Check for company names in title and description
    const contentWords = content.split(/\s+/);
    for (let i = 0; i < contentWords.length - 1; i++) {
      if (contentWords[i].length > 1 && 
          contentWords[i][0] === contentWords[i][0].toUpperCase() && 
          companyKeywords.some(keyword => contentWords[i+1].toLowerCase().includes(keyword))) {
        affectedOrganizations.push(contentWords[i]);
      }
    }
    
    // Check article source as potentially affected organization
    if (article.source && article.source.name) {
      if (!affectedOrganizations.includes(article.source.name)) {
        affectedOrganizations.push(article.source.name);
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
        affected_organizations: affectedOrganizations.length > 0 ? affectedOrganizations : null,
      }, {
        onConflict: 'title'
      });
    
    if (error) {
      console.error('Error inserting news event:', error);
    }
  }
}
