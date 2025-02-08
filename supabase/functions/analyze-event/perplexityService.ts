
const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');

interface ConfidenceScores {
  overall_prediction: number;
  sector_impact: number;
  market_direction: number;
}

interface MarketSentiment {
  short_term: string;
  long_term: string;
}

interface StockPredictions {
  positive: string[];
  negative: string[];
  confidence_scores: ConfidenceScores;
}

interface AnalysisMetadata {
  confidence_factors: string[];
  uncertainty_factors: string[];
  data_quality_score: number;
}

export interface ImpactAnalysis {
  affected_sectors: string[];
  market_impact: string;
  supply_chain_impact: string;
  market_sentiment: MarketSentiment;
  stock_predictions: StockPredictions;
  risk_level: "low" | "medium" | "high" | "critical";
  analysis_metadata: AnalysisMetadata;
}

export async function generateAnalysis(event: any): Promise<ImpactAnalysis> {
  if (!perplexityApiKey) {
    throw new Error('Perplexity API key is not configured');
  }

  const prompt = buildPrompt(event);
  console.log("Sending request to Perplexity with prompt:", prompt);

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
          content: 'You are a financial analysis AI that specializes in market impact predictions. Always return valid JSON with detailed analysis and confidence metrics. Never include markdown or explanations outside the JSON structure.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 1000,
      presence_penalty: 0,
      frequency_penalty: 0
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error("Perplexity API error:", errorData);
    throw new Error(`Perplexity API error: ${errorData}`);
  }

  const data = await response.json();
  console.log("Raw Perplexity response:", data);

  if (!data.choices?.[0]?.message?.content) {
    throw new Error("Invalid response format from Perplexity");
  }

  const cleanContent = data.choices[0].message.content.trim();
  return parseAndValidateAnalysis(cleanContent);
}

function buildPrompt(event: any): string {
  let affectedOrgsString = 'Unknown';
  if (event.affected_organizations) {
    if (Array.isArray(event.affected_organizations)) {
      affectedOrgsString = event.affected_organizations.join(', ');
    } else if (typeof event.affected_organizations === 'object' && event.affected_organizations !== null) {
      affectedOrgsString = Object.values(event.affected_organizations).filter(Boolean).join(', ');
    } else if (typeof event.affected_organizations === 'string') {
      affectedOrgsString = event.affected_organizations;
    }
  }

  return `You are a financial market analyst specializing in event impact analysis. Analyze this event thoroughly and provide a comprehensive market impact analysis in valid JSON format. Consider historical precedents, sector correlations, and macroeconomic conditions.

    Event Details:
    Event Type: ${event.event_type || 'Unknown'}
    Location: ${event.city ? `${event.city}, ` : ''}${event.country || 'Unknown'}
    Description: ${event.description || 'No description provided'}
    Affected Organizations: ${affectedOrgsString}
    Severity: ${event.severity || 'Unknown'}

    Return ONLY a JSON object with these exact fields (no explanation, no markdown, just pure JSON):
    {
      "affected_sectors": string[],
      "market_impact": string,
      "supply_chain_impact": string,
      "market_sentiment": {
        "short_term": string,
        "long_term": string
      },
      "stock_predictions": {
        "positive": string[],
        "negative": string[],
        "confidence_scores": {
          "overall_prediction": number,
          "sector_impact": number,
          "market_direction": number
        }
      },
      "risk_level": "low" | "medium" | "high" | "critical",
      "analysis_metadata": {
        "confidence_factors": string[],
        "uncertainty_factors": string[],
        "data_quality_score": number
      }
    }`;
}

function parseAndValidateAnalysis(content: string): ImpactAnalysis {
  try {
    const analysis = JSON.parse(content);
    
    // Validate required fields
    const requiredFields = [
      'affected_sectors',
      'market_impact',
      'supply_chain_impact',
      'market_sentiment',
      'stock_predictions',
      'risk_level',
      'analysis_metadata'
    ];

    for (const field of requiredFields) {
      if (!(field in analysis)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate confidence scores
    const confidenceScores = analysis.stock_predictions.confidence_scores;
    for (const [key, value] of Object.entries(confidenceScores)) {
      if (typeof value !== 'number' || value < 0 || value > 1) {
        throw new Error(`Invalid confidence score for ${key}: must be between 0 and 1`);
      }
    }

    return analysis;
  } catch (error) {
    console.error("Error parsing JSON response:", error);
    console.error("Content that failed to parse:", content);
    throw new Error(`Failed to parse analysis response: ${error.message}`);
  }
}
