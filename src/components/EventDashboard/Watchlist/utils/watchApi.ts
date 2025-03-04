
import { supabase } from "@/integrations/supabase/client";
import { StockWatch } from "../types";

/**
 * Fetches all stock watches for a user
 */
export const fetchUserWatches = async (userId: string): Promise<StockWatch[]> => {
  const { data: watches, error } = await supabase
    .from('user_stock_watches')
    .select(`
      id,
      created_at,
      status,
      entry_price,
      investment_amount,
      investment_type,
      broker_connection_id,
      stock_prediction:stock_predictions!stock_prediction_id (
        id,
        symbol,
        rationale,
        is_positive,
        target_price,
        price_change_percentage,
        price_impact_analysis,
        confidence_score,
        last_analysis_date,
        event:events!stock_predictions_event_id_fkey (
          id,
          title,
          description,
          event_type,
          severity,
          created_at,
          affected_organizations
        )
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'WATCHING')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching watches:', error);
    throw error;
  }
  
  return formatWatchesData(watches);
};

/**
 * Formats the raw watches data from Supabase
 */
const formatWatchesData = (watches: any[]): StockWatch[] => {
  return watches?.map(watch => ({
    ...watch,
    stock_prediction: {
      ...watch.stock_prediction,
      price_impact_analysis: watch.stock_prediction.price_impact_analysis 
        ? {
            summary: String((watch.stock_prediction.price_impact_analysis as any).summary || ''),
            factors: Array.isArray((watch.stock_prediction.price_impact_analysis as any).factors) 
              ? (watch.stock_prediction.price_impact_analysis as any).factors 
              : [],
            risks: Array.isArray((watch.stock_prediction.price_impact_analysis as any).risks)
              ? (watch.stock_prediction.price_impact_analysis as any).risks
              : []
          }
        : null
    }
  })) as StockWatch[];
};

/**
 * Updates a watch status to 'CANCELLED'
 */
export const unwatchStock = async (watchId: string) => {
  const { error } = await supabase
    .from('user_stock_watches')
    .update({ status: 'CANCELLED' })
    .eq('id', watchId);

  if (error) throw error;
  return true;
};

/**
 * Creates a new stock watch in the database
 */
export const createStockWatch = async (
  userId: string,
  stockPredictionId: string,
  investmentType: "FOLLOW_ONLY" | "INVEST_AND_FOLLOW",
  brokerConnectionId: string | null,
  amount?: number
) => {
  const { error } = await supabase
    .from('user_stock_watches')
    .insert([{
      user_id: userId,
      stock_prediction_id: stockPredictionId,
      status: investmentType === "INVEST_AND_FOLLOW" ? "INVESTING" : "WATCHING",
      investment_type: investmentType,
      investment_amount: amount,
      broker_connection_id: brokerConnectionId
    }]);

  if (error) throw error;
  return true;
};
