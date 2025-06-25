
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import { corsHeaders, securityHeaders, validateRequest, sanitizeInput, rateLimitCheck } from './securityMiddleware.ts';
import { generateMarketSentiment } from './predictionGenerators.ts';
import { fetchFinancialData } from './apiServices.ts';
import { updateStockPrediction } from './databaseServices.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: { ...corsHeaders, ...securityHeaders } 
    });
  }

  try {
    // Security validation
    const validation = validateRequest(req);
    if (!validation.isValid) {
      return new Response(
        JSON.stringify({ error: validation.error }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, ...securityHeaders } 
        }
      );
    }

    // Verify JWT token
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization format' }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, ...securityHeaders } 
        }
      );
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, ...securityHeaders } 
        }
      );
    }

    // Rate limiting check
    const clientId = user.id;
    const rateLimitResult = rateLimitCheck(clientId);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          resetTime: rateLimitResult.resetTime 
        }), 
        { 
          status: 429, 
          headers: { ...corsHeaders, ...securityHeaders } 
        }
      );
    }

    // Parse and sanitize request body
    const rawBody = await req.json();
    const body = sanitizeInput(rawBody);
    
    const { symbol, eventId } = body;
    
    if (!symbol || !eventId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: symbol and eventId' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, ...securityHeaders } 
        }
      );
    }

    console.log(`Processing market sentiment for symbol: ${symbol}, event: ${eventId}`);

    // Fetch financial data
    const financialData = await fetchFinancialData(symbol);
    
    // Generate market sentiment analysis
    const sentimentAnalysis = await generateMarketSentiment(symbol, financialData);
    
    // Update stock prediction with sentiment data
    await updateStockPrediction(supabase, eventId, symbol, sentimentAnalysis);

    return new Response(
      JSON.stringify({ 
        success: true, 
        symbol, 
        sentimentAnalysis 
      }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, ...securityHeaders } 
      }
    );

  } catch (error) {
    console.error('Market sentiment error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, ...securityHeaders } 
      }
    );
  }
});
