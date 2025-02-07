
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

    // Fetch data from GDACS RSS feed
    const response = await fetch('https://www.gdacs.org/xml/rss.xml');
    const text = await response.text();
    
    // Parse XML to JSON
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "text/xml");
    const items = xmlDoc.getElementsByTagName("item");

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
        console.error('Error inserting event:', error);
      }
    }

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
