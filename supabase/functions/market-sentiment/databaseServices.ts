
// Database services for interacting with Supabase

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

// Update stock prediction with sentiment analysis
export async function updateStockPrediction(
  supabase: ReturnType<typeof createClient>,
  eventId: string,
  symbol: string,
  sentimentData: any
) {
  try {
    if (!eventId) return;

    const { data: stockPrediction, error: fetchError } = await supabase
      .from('stock_predictions')
      .select('id')
      .eq('event_id', eventId)
      .eq('symbol', symbol)
      .single();
      
    if (stockPrediction && !fetchError) {
      // Update the stock prediction with sentiment analysis
      const { error: updateError } = await supabase
        .from('stock_predictions')
        .update({
          sentiment_analysis: sentimentData,
          last_analysis_date: new Date().toISOString()
        })
        .eq('id', stockPrediction.id);
        
      if (updateError) {
        console.error('Error updating stock prediction:', updateError);
      } else {
        console.log(`Updated stock prediction ${stockPrediction.id} with sentiment analysis`);
      }
    }
  } catch (dbError) {
    console.error('Error interacting with database:', dbError);
  }
}
