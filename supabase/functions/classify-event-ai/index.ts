
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from '../fetch-events/corsHeaders.ts';

interface ClassificationRequest {
  title: string;
  description: string;
}

interface ClassificationResponse {
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  eventType: "NATURAL_DISASTER" | "GEOPOLITICAL" | "ECONOMIC" | "OTHER";
  confidence: number;
  reasoning: string;
}

console.log("Loading classify-event-ai function");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    const { title, description } = await req.json() as ClassificationRequest;
    
    if (!title || !description) {
      return new Response(
        JSON.stringify({ error: 'Title and description are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    if (!perplexityApiKey) {
      console.error('PERPLEXITY_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const prompt = `Analyze this news event and classify it for financial market impact monitoring. 

EVENT TITLE: "${title}"
EVENT DESCRIPTION: "${description}"

You must classify this event into EXACTLY the following categories:

SEVERITY LEVELS (be very strict with these definitions):
- CRITICAL: Global catastrophic events that reshape markets (nuclear incidents, world wars, complete market collapses, major natural disasters affecting multiple countries, assassination of world leaders)
- HIGH: Significant events with major market impact (large corporate bankruptcies, major geopolitical conflicts, significant natural disasters, major policy changes affecting entire sectors)
- MEDIUM: Notable events with moderate market relevance (earnings misses, regional conflicts, moderate natural disasters, industry-specific news)
- LOW: Routine news with minimal market impact (regular corporate updates, minor policy changes, small local events, opinion pieces)

EVENT TYPES:
- NATURAL_DISASTER: Natural catastrophes, weather events, geological events
- GEOPOLITICAL: Political events, conflicts, elections, international relations, policy changes
- ECONOMIC: Market movements, corporate earnings, economic indicators, financial policy, business news
- OTHER: Everything else that doesn't fit the above categories

IMPORTANT GUIDELINES:
- Focus on ACTUAL MARKET IMPACT, not just sensational headlines
- Consider the SCALE and SCOPE of the event
- Most regular business/earnings news should be MEDIUM or LOW
- Only use CRITICAL for truly catastrophic, world-changing events
- Consider both immediate and long-term market implications
- Be conservative with HIGH and CRITICAL classifications

Respond with ONLY a valid JSON object in this exact format:
{
  "severity": "LOW|MEDIUM|HIGH|CRITICAL",
  "eventType": "NATURAL_DISASTER|GEOPOLITICAL|ECONOMIC|OTHER", 
  "confidence": 0.XX,
  "reasoning": "Brief explanation of why you chose this classification"
}`;

    console.log('Sending classification request to Perplexity AI');
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a financial market analyst specializing in event impact classification. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        top_p: 0.9,
        max_tokens: 500,
        return_images: false,
        return_related_questions: false
      }),
    });

    if (!response.ok) {
      console.error(`Perplexity API error: ${response.statusText}`);
      throw new Error(`AI classification failed: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    console.log('AI Response:', aiResponse);
    
    // Parse the AI response
    let classification: ClassificationResponse;
    try {
      // Clean the response to extract JSON
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }
      
      classification = JSON.parse(jsonMatch[0]);
      
      // Validate the response structure
      if (!classification.severity || !classification.eventType || 
          typeof classification.confidence !== 'number' || !classification.reasoning) {
        throw new Error('Invalid classification structure');
      }
      
      // Validate enum values
      const validSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      const validEventTypes = ['NATURAL_DISASTER', 'GEOPOLITICAL', 'ECONOMIC', 'OTHER'];
      
      if (!validSeverities.includes(classification.severity) || 
          !validEventTypes.includes(classification.eventType)) {
        throw new Error('Invalid classification values');
      }
      
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError, 'Raw response:', aiResponse);
      throw new Error('Failed to parse AI classification response');
    }

    console.log(`AI classified event: ${classification.severity} (${classification.confidence}) - ${classification.reasoning}`);

    return new Response(
      JSON.stringify(classification),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in classify-event-ai function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Classification failed', 
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
