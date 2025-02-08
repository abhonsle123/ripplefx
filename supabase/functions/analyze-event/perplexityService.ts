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
          content: 'You are a financial analysis AI that specializes in market impact predictions. For stock predictions, always return between 1 and 3 stocks for both positive and negative impacts. Always return valid JSON with detailed analysis and confidence metrics. Format your response as a single, complete JSON object without any additional text or markdown formatting.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 1000,
      frequency_penalty: 0.1
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error("Perplexity API error:", errorData);
    throw new Error(`Perplexity API error: ${errorData}`);
  }

  const data = await response.json();
  console.log("Raw Perplexity response:", JSON.stringify(data, null, 2));

  if (!data.choices?.[0]?.message?.content) {
    console.error("Invalid response structure:", data);
    throw new Error("Invalid response format from Perplexity");
  }

  let cleanContent = data.choices[0].message.content.trim();
  console.log("Raw content before cleaning:", cleanContent);
  
  // Remove any markdown code block markers
  cleanContent = cleanContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  
  // Remove any trailing commas in arrays and objects
  cleanContent = cleanContent.replace(/,(\s*[}\]])/g, '$1');

  // Remove any additional text before or after the JSON object
  const jsonStart = cleanContent.indexOf('{');
  const jsonEnd = cleanContent.lastIndexOf('}') + 1;
  
  if (jsonStart === -1 || jsonEnd === 0) {
    console.error("No valid JSON object found in content:", cleanContent);
    throw new Error("No valid JSON object found in response");
  }
  
  cleanContent = cleanContent.slice(jsonStart, jsonEnd);
  console.log("Cleaned content before parsing:", cleanContent);

  try {
    const parsedContent = JSON.parse(cleanContent);

    // Validate and enforce stock limits
    if (parsedContent.stock_predictions) {
      if (parsedContent.stock_predictions.positive) {
        if (parsedContent.stock_predictions.positive.length === 0) {
          parsedContent.stock_predictions.positive = ['Default Stock'];
        } else if (parsedContent.stock_predictions.positive.length > 3) {
          parsedContent.stock_predictions.positive = parsedContent.stock_predictions.positive.slice(0, 3);
        }
      }

      if (parsedContent.stock_predictions.negative) {
        if (parsedContent.stock_predictions.negative.length === 0) {
          parsedContent.stock_predictions.negative = ['Default Stock'];
        } else if (parsedContent.stock_predictions.negative.length > 3) {
          parsedContent.stock_predictions.negative = parsedContent.stock_predictions.negative.slice(0, 3);
        }
      }
    }

    cleanContent = JSON.stringify(parsedContent);
  } catch (error) {
    console.error("Failed to validate JSON structure:", error);
    console.error("Content that failed validation:", cleanContent);
    throw new Error("Invalid JSON structure in response");
  }

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

  return `Analyze this event and provide a market impact analysis. Return ONLY a JSON object with these exact fields (no explanation, no markdown):
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
          "overall_prediction": 0.0,
          "sector_impact": 0.0,
          "market_direction": 0.0
        }
      },
      "risk_level": "low",
      "analysis_metadata": {
        "confidence_factors": [],
        "uncertainty_factors": [],
        "data_quality_score": 0.0
      }
    }

    Event Details:
    Type: ${event.event_type || 'Unknown'}
    Location: ${event.city ? `${event.city}, ` : ''}${event.country || 'Unknown'}
    Description: ${event.description || 'No description provided'}
    Affected Organizations: ${affectedOrgsString}
    Severity: ${event.severity || 'Unknown'}

    Consider regional vs global impact, industry-specific effects, company-level impact, and market sentiment factors. Be specific and concise.`;
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

    // Ensure arrays are actually arrays and initialize if missing
    if (!Array.isArray(analysis.affected_sectors)) {
      analysis.affected_sectors = [];
    }
    if (!Array.isArray(analysis.stock_predictions.positive)) {
      analysis.stock_predictions.positive = [];
    }
    if (!Array.isArray(analysis.stock_predictions.negative)) {
      analysis.stock_predictions.negative = [];
    }
    if (!Array.isArray(analysis.analysis_metadata.confidence_factors)) {
      analysis.analysis_metadata.confidence_factors = [];
    }
    if (!Array.isArray(analysis.analysis_metadata.uncertainty_factors)) {
      analysis.analysis_metadata.uncertainty_factors = [];
    }

    // Validate risk level
    if (!['low', 'medium', 'high', 'critical'].includes(analysis.risk_level)) {
      analysis.risk_level = 'medium';
    }

    // Ensure data quality score is a number between 0 and 1
    if (typeof analysis.analysis_metadata.data_quality_score !== 'number' || 
        analysis.analysis_metadata.data_quality_score < 0 || 
        analysis.analysis_metadata.data_quality_score > 1) {
      analysis.analysis_metadata.data_quality_score = 0.5;
    }

    return analysis;
  } catch (error) {
    console.error("Error parsing JSON response:", error);
    console.error("Content that failed to parse:", content);
    throw new Error(`Failed to parse analysis response: ${error.message}`);
  }
}
