
import { ImpactAnalysis } from "./types.ts";

export function validateAndNormalizeAnalysis(analysis: any): ImpactAnalysis {
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
