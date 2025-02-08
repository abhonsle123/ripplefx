
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

  try {
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
            content: 'You are a financial analysis AI that specializes in market impact predictions. You must return a valid JSON object containing exactly the fields specified, with no additional text or markdown. For stock predictions, return between 1 and 3 stocks for both positive and negative impacts.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Perplexity API error:", errorData);
      throw new Error(`Perplexity API error: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    console.log("Raw Perplexity response:", JSON.stringify(data, null, 2));

    if (!data.choices?.[0]?.message?.content) {
      console.error("Invalid response structure:", data);
      throw new Error("Invalid response format from Perplexity");
    }

    let cleanContent = data.choices[0].message.content.trim();
    cleanContent = cleanContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    cleanContent = cleanContent.replace(/,(\s*[}\]])/g, '$1');
    
    console.log("Cleaned content before parsing:", cleanContent);

    try {
      const analysis = JSON.parse(cleanContent);
      return validateAndNormalizeAnalysis(analysis);
    } catch (error) {
      console.error("JSON parse error:", error);
      console.error("Content that failed to parse:", cleanContent);
      return getDefaultAnalysis();
    }
  } catch (error) {
    console.error("Error in generateAnalysis:", error);
    return getDefaultAnalysis();
  }
}

function buildPrompt(event: any): string {
  const affectedOrgsString = formatAffectedOrganizations(event.affected_organizations);

  return `Analyze this event and provide a market impact analysis. Return ONLY the following JSON structure with NO additional text or markdown:
    {
      "affected_sectors": [],
      "market_impact": "",
      "supply_chain_impact": "",
      "market_sentiment": {
        "short_term": "",
        "long_term": ""
      },
      "stock_predictions": {
        "positive": [],
        "negative": [],
        "confidence_scores": {
          "overall_prediction": 0.5,
          "sector_impact": 0.5,
          "market_direction": 0.5
        }
      },
      "risk_level": "low",
      "analysis_metadata": {
        "confidence_factors": [],
        "uncertainty_factors": [],
        "data_quality_score": 0.5
      }
    }

    Event Details:
    Type: ${event.event_type || 'Unknown'}
    Location: ${event.city ? `${event.city}, ` : ''}${event.country || 'Unknown'}
    Description: ${event.description || 'No description provided'}
    Affected Organizations: ${affectedOrgsString}
    Severity: ${event.severity || 'Unknown'}`;
}

function formatAffectedOrganizations(organizations: any): string {
  if (!organizations) return 'Unknown';
  
  if (Array.isArray(organizations)) {
    return organizations.join(', ');
  }
  
  if (typeof organizations === 'object') {
    return Object.values(organizations).filter(Boolean).join(', ');
  }
  
  if (typeof organizations === 'string') {
    return organizations;
  }
  
  return 'Unknown';
}

function validateAndNormalizeAnalysis(analysis: any): ImpactAnalysis {
  // Ensure affected_sectors is an array
  if (!Array.isArray(analysis.affected_sectors)) {
    analysis.affected_sectors = [];
  }

  // Validate and normalize stock predictions
  if (!analysis.stock_predictions) {
    analysis.stock_predictions = {
      positive: ['Default Stock 1'],
      negative: ['Default Stock 1'],
      confidence_scores: {
        overall_prediction: 0.5,
        sector_impact: 0.5,
        market_direction: 0.5
      }
    };
  }

  // Ensure between 1 and 3 stocks for positive predictions
  if (!Array.isArray(analysis.stock_predictions.positive) || 
      analysis.stock_predictions.positive.length < 1 ||
      analysis.stock_predictions.positive.length > 3) {
    analysis.stock_predictions.positive = ['Default Stock 1'];
  }

  // Ensure between 1 and 3 stocks for negative predictions
  if (!Array.isArray(analysis.stock_predictions.negative) || 
      analysis.stock_predictions.negative.length < 1 ||
      analysis.stock_predictions.negative.length > 3) {
    analysis.stock_predictions.negative = ['Default Stock 1'];
  }

  // Validate confidence scores
  if (!analysis.stock_predictions.confidence_scores) {
    analysis.stock_predictions.confidence_scores = {
      overall_prediction: 0.5,
      sector_impact: 0.5,
      market_direction: 0.5
    };
  }

  // Ensure all confidence scores are numbers between 0 and 1
  ['overall_prediction', 'sector_impact', 'market_direction'].forEach(key => {
    const score = analysis.stock_predictions.confidence_scores[key];
    if (typeof score !== 'number' || score < 0 || score > 1) {
      analysis.stock_predictions.confidence_scores[key] = 0.5;
    }
  });

  // Validate market sentiment
  if (!analysis.market_sentiment || typeof analysis.market_sentiment !== 'object') {
    analysis.market_sentiment = {
      short_term: "Neutral",
      long_term: "Neutral"
    };
  }

  // Validate risk level
  if (!['low', 'medium', 'high', 'critical'].includes(analysis.risk_level)) {
    analysis.risk_level = 'medium';
  }

  // Validate and normalize analysis metadata
  if (!analysis.analysis_metadata || typeof analysis.analysis_metadata !== 'object') {
    analysis.analysis_metadata = {
      confidence_factors: [],
      uncertainty_factors: [],
      data_quality_score: 0.5
    };
  }

  // Ensure arrays exist
  if (!Array.isArray(analysis.analysis_metadata.confidence_factors)) {
    analysis.analysis_metadata.confidence_factors = [];
  }
  if (!Array.isArray(analysis.analysis_metadata.uncertainty_factors)) {
    analysis.analysis_metadata.uncertainty_factors = [];
  }

  // Validate data quality score
  if (typeof analysis.analysis_metadata.data_quality_score !== 'number' ||
      analysis.analysis_metadata.data_quality_score < 0 ||
      analysis.analysis_metadata.data_quality_score > 1) {
    analysis.analysis_metadata.data_quality_score = 0.5;
  }

  return analysis;
}

function getDefaultAnalysis(): ImpactAnalysis {
  return {
    affected_sectors: [],
    market_impact: "Unable to analyze impact",
    supply_chain_impact: "Unable to analyze supply chain impact",
    market_sentiment: {
      short_term: "Neutral",
      long_term: "Neutral"
    },
    stock_predictions: {
      positive: ["Default Stock 1"],
      negative: ["Default Stock 1"],
      confidence_scores: {
        overall_prediction: 0.5,
        sector_impact: 0.5,
        market_direction: 0.5
      }
    },
    risk_level: "medium",
    analysis_metadata: {
      confidence_factors: [],
      uncertainty_factors: [],
      data_quality_score: 0.5
    }
  };
}
