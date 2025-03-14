
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

/**
 * Gets the active broker connection for a user
 */
export const getBrokerConnection = async (userId: string) => {
  const { data, error } = await supabase
    .from('broker_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('No active broker connection found. Please connect a broker first.');
    }
    throw error;
  }

  return data;
};

/**
 * Execute a trade for a stock prediction
 */
export const executeTrade = async (
  stockPredictionId: string,
  amount: number,
  brokerId: string,
  userId: string
) => {
  const { data, error } = await supabase.functions.invoke('execute-trade', {
    body: {
      stockPredictionId,
      amount,
      brokerId,
      userId
    },
  });

  if (error) {
    console.error('Error executing trade:', error);
    throw new Error(error.message || 'Failed to execute trade');
  }

  return data;
};

/**
 * Get the latest price and update price prediction
 */
export const analyzeStockPrice = async (stockPredictionId: string) => {
  const { data, error } = await supabase.functions.invoke('analyze-stock-price', {
    body: {
      stockPredictionId
    },
  });

  if (error) {
    console.error('Error analyzing stock price:', error);
    throw new Error(error.message || 'Failed to analyze stock price');
  }

  return data;
};
