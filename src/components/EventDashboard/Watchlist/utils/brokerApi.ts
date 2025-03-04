
import { supabase } from "@/integrations/supabase/client";

/**
 * Gets the active broker connection for a user
 */
export const getBrokerConnection = async (userId: string) => {
  const { data: connection, error } = await supabase
    .from('broker_connections')
    .select('id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  if (error) {
    throw error;
  }
  return connection;
};

/**
 * Executes a trade through the Supabase Edge Function
 */
export const executeTrade = async (
  stockPredictionId: string,
  amount: number,
  brokerConnectionId: string,
  userId: string
) => {
  console.log('Calling execute-trade function with:', {
    stockPredictionId,
    amount,
    brokerConnectionId,
    userId
  });

  const { data: response, error } = await supabase.functions.invoke('execute-trade', {
    body: {
      stockPredictionId,
      amount,
      brokerConnectionId,
      userId
    }
  });

  if (error) {
    console.error('Trade execution error:', error);
    throw error;
  }

  console.log('Trade execution response:', response);
  return response;
};

/**
 * Analyzes the price of a stock prediction
 */
export const analyzeStockPrice = async (stockPredictionId: string) => {
  console.log('Starting price analysis for prediction:', stockPredictionId);
  
  const { data, error } = await supabase.functions.invoke('analyze-stock-price', {
    body: { stock_prediction_id: stockPredictionId },
  });
  
  if (error) {
    console.error('Error in analyze-stock-price function:', error);
    throw error;
  }
  
  console.log('Analysis completed successfully:', data);
  return data;
};
