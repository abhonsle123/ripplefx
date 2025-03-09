
import { ImpactAnalysis } from "./types.ts";

export function validateAndNormalizeAnalysis(analysis: any): ImpactAnalysis {
  // Make sure we always have a valid structure to work with
  if (!analysis || typeof analysis !== 'object') {
    console.error("Invalid analysis object received");
    analysis = {};
  }

  // Ensure affected_sectors is an array of relevant sectors
  if (!Array.isArray(analysis.affected_sectors) || analysis.affected_sectors.length === 0) {
    // Add default sectors based on event type if available
    analysis.affected_sectors = ["Technology", "Finance", "Consumer Goods"];
    console.log("Using default sectors due to missing/invalid affected_sectors");
  } else {
    // Limit to reasonable number of sectors and remove duplicates
    analysis.affected_sectors = [...new Set(analysis.affected_sectors)].slice(0, 5);
  }

  // Validate and normalize stock predictions
  if (!analysis.stock_predictions || typeof analysis.stock_predictions !== 'object') {
    console.log("Missing or invalid stock_predictions, creating default structure");
    analysis.stock_predictions = {
      positive: [{ symbol: 'SPY', rationale: 'Default prediction for market tracking ETF' }],
      negative: [{ symbol: 'VIX', rationale: 'Default prediction for volatility index' }],
      confidence_scores: {
        overall_prediction: 0.6,
        sector_impact: 0.65,
        market_direction: 0.55
      }
    };
  }

  // Ensure proper stock predictions format and normalize symbols
  const normalizeStockPredictions = (predictions: any[], isPositive: boolean) => {
    if (!Array.isArray(predictions)) {
      console.log(`Invalid ${isPositive ? 'positive' : 'negative'} predictions format`);
      return [];
    }
    
    return predictions
      .filter(p => p && typeof p.symbol === 'string' && p.symbol.trim() !== '')
      .map(p => {
        // Extract and uppercase the ticker
        const cleanSymbol = p.symbol.split(' ')[0].toUpperCase();
        
        // Ensure rationale is detailed and mentions expected magnitude
        let rationale = typeof p.rationale === 'string' ? p.rationale : 'No rationale provided';
        if (rationale.length < 50) {
          rationale += isPositive 
            ? ' This stock is expected to see moderate positive movement due to market positioning.'
            : ' This stock is expected to see moderate negative impact due to market exposure.';
        }
        
        return {
          symbol: cleanSymbol,
          rationale: rationale
        };
      })
      .slice(0, 3); // Limit to max 3 predictions for better quality focus
  };

  // Normalize positive predictions
  analysis.stock_predictions.positive = normalizeStockPredictions(
    analysis.stock_predictions.positive, true
  );
  if (analysis.stock_predictions.positive.length === 0) {
    console.log("No valid positive predictions, adding default prediction");
    analysis.stock_predictions.positive = [{ 
      symbol: 'SPY',
      rationale: 'The S&P 500 tracking ETF typically benefits from general market stability and recovery following this type of event. Historical precedent suggests similar events have led to measured market resilience.'
    }];
  }

  // Normalize negative predictions
  analysis.stock_predictions.negative = normalizeStockPredictions(
    analysis.stock_predictions.negative, false
  );
  if (analysis.stock_predictions.negative.length === 0) {
    console.log("No valid negative predictions, adding default prediction");
    analysis.stock_predictions.negative = [{
      symbol: 'VIX',
      rationale: 'The volatility index typically responds to uncertainty created by this type of event. Market participants are likely to seek hedges against potential downside risks.'
    }];
  }

  // Validate and normalize confidence scores
  if (!analysis.stock_predictions.confidence_scores || typeof analysis.stock_predictions.confidence_scores !== 'object') {
    console.log("Invalid confidence scores, using balanced default values");
    analysis.stock_predictions.confidence_scores = {
      overall_prediction: 0.68,
      sector_impact: 0.72,
      market_direction: 0.65
    };
  }

  // Ensure confidence scores are realistic (not too extreme)
  const normalizeConfidenceScore = (key: string, defaultValue: number) => {
    const score = analysis.stock_predictions.confidence_scores[key];
    if (typeof score !== 'number' || score < 0 || score > 1) {
      console.log(`Invalid ${key} score, using default value`);
      return defaultValue;
    }
    
    // Avoid extreme confidence values unless justified
    if (score > 0.9) return 0.85;
    if (score < 0.4) return 0.45;
    
    return score;
  };

  analysis.stock_predictions.confidence_scores.overall_prediction = 
    normalizeConfidenceScore('overall_prediction', 0.68);
  analysis.stock_predictions.confidence_scores.sector_impact = 
    normalizeConfidenceScore('sector_impact', 0.72);
  analysis.stock_predictions.confidence_scores.market_direction = 
    normalizeConfidenceScore('market_direction', 0.65);

  // Validate market sentiment
  if (!analysis.market_sentiment || typeof analysis.market_sentiment !== 'object') {
    console.log("Invalid market sentiment, using balanced default values");
    analysis.market_sentiment = {
      short_term: "Cautious with potential for volatility",
      long_term: "Neutral with sector-specific opportunities"
    };
  }

  // Validate risk level to ensure it's appropriate
  if (!['low', 'medium', 'high', 'critical'].includes(analysis.risk_level)) {
    console.log("Invalid risk level, using medium as default");
    analysis.risk_level = 'medium';
  }

  // Validate and normalize analysis metadata
  if (!analysis.analysis_metadata || typeof analysis.analysis_metadata !== 'object') {
    console.log("Invalid analysis metadata, creating default structure");
    analysis.analysis_metadata = {
      confidence_factors: ["Historical precedents", "Market indicators"],
      uncertainty_factors: ["Evolving situation", "Limited data"],
      data_quality_score: 0.7
    };
  }

  // Ensure arrays are properly initialized
  if (!Array.isArray(analysis.analysis_metadata.confidence_factors)) {
    analysis.analysis_metadata.confidence_factors = ["Historical precedents"];
  }
  if (!Array.isArray(analysis.analysis_metadata.uncertainty_factors)) {
    analysis.analysis_metadata.uncertainty_factors = ["Limited data"];
  }

  // Normalize data quality score
  if (typeof analysis.analysis_metadata.data_quality_score !== 'number' ||
      analysis.analysis_metadata.data_quality_score < 0 ||
      analysis.analysis_metadata.data_quality_score > 1) {
    analysis.analysis_metadata.data_quality_score = 0.7;
  }

  // Return the normalized analysis
  return analysis;
}
