
import { ImpactAnalysis } from "./types.ts";

export function validateAndNormalizeAnalysis(analysis: any): ImpactAnalysis {
  // Ensure affected_sectors is an array
  if (!Array.isArray(analysis.affected_sectors)) {
    analysis.affected_sectors = [];
  }

  // Validate and normalize stock predictions
  if (!analysis.stock_predictions) {
    analysis.stock_predictions = {
      positive: [{ symbol: 'SPY', rationale: 'Default prediction' }],
      negative: [{ symbol: 'VIX', rationale: 'Default prediction' }],
      confidence_scores: {
        overall_prediction: 0.5,
        sector_impact: 0.5,
        market_direction: 0.5
      }
    };
  }

  // Ensure proper stock predictions format and normalize symbols
  const normalizeStockPredictions = (predictions: any[]) => {
    if (!Array.isArray(predictions)) return [];
    return predictions
      .filter(p => p && typeof p.symbol === 'string' && p.symbol.trim() !== '')
      .map(p => ({
        ...p,
        symbol: p.symbol.split(' ')[0].toUpperCase(), // Extract and uppercase the ticker
        rationale: typeof p.rationale === 'string' ? p.rationale : 'No rationale provided'
      }))
      .slice(0, 3); // Limit to max 3 predictions
  };

  // Normalize positive predictions
  analysis.stock_predictions.positive = normalizeStockPredictions(
    analysis.stock_predictions.positive
  );
  if (analysis.stock_predictions.positive.length === 0) {
    analysis.stock_predictions.positive = [{ 
      symbol: 'SPY',
      rationale: 'Default positive prediction'
    }];
  }

  // Normalize negative predictions
  analysis.stock_predictions.negative = normalizeStockPredictions(
    analysis.stock_predictions.negative
  );
  if (analysis.stock_predictions.negative.length === 0) {
    analysis.stock_predictions.negative = [{
      symbol: 'VIX',
      rationale: 'Default negative prediction'
    }];
  }

  // Validate confidence scores
  if (!analysis.stock_predictions.confidence_scores) {
    analysis.stock_predictions.confidence_scores = {
      overall_prediction: 0.5,
      sector_impact: 0.5,
      market_direction: 0.5
    };
  }

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

  if (!Array.isArray(analysis.analysis_metadata.confidence_factors)) {
    analysis.analysis_metadata.confidence_factors = [];
  }
  if (!Array.isArray(analysis.analysis_metadata.uncertainty_factors)) {
    analysis.analysis_metadata.uncertainty_factors = [];
  }

  if (typeof analysis.analysis_metadata.data_quality_score !== 'number' ||
      analysis.analysis_metadata.data_quality_score < 0 ||
      analysis.analysis_metadata.data_quality_score > 1) {
    analysis.analysis_metadata.data_quality_score = 0.5;
  }

  return analysis;
}
