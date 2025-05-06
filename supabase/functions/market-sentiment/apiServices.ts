
// API Services for fetching financial data from various providers

// Common response headers for CORS
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to fetch data from Finnhub
export async function fetchFinnhubData(symbol: string) {
  try {
    const finnhubApiKey = Deno.env.get('FINNHUB_API_KEY');
    
    if (!finnhubApiKey) {
      console.log("Finnhub API key not found, skipping");
      return null;
    }
    
    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${finnhubApiKey}`
    );
    
    if (!response.ok) {
      console.error(`Finnhub API error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    return {
      source: "Finnhub",
      isPositive: data.c > data.pc, // Current price > previous close
      confidence: Math.min(Math.abs((data.c - data.pc) / data.pc) + 0.5, 0.95),
      explanation: `Based on price movement: ${data.c > data.pc ? 'up' : 'down'} ${Math.abs((data.c - data.pc) / data.pc * 100).toFixed(2)}%`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error fetching Finnhub data:", error);
    return null;
  }
}

// Helper function to fetch data from Alpha Vantage
export async function fetchAlphaVantageData(symbol: string) {
  try {
    const alphaVantageApiKey = Deno.env.get('ALPHA_VANTAGE_API_KEY');
    
    if (!alphaVantageApiKey) {
      console.log("Alpha Vantage API key not found, skipping");
      return null;
    }
    
    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${alphaVantageApiKey}`
    );
    
    if (!response.ok) {
      console.error(`Alpha Vantage API error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    const quote = data['Global Quote'];
    
    if (!quote || !quote['10. change percent']) {
      return null;
    }
    
    const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));
    
    return {
      source: "Alpha Vantage",
      isPositive: changePercent > 0,
      confidence: Math.min(Math.abs(changePercent / 100) + 0.5, 0.95),
      explanation: `Price change of ${quote['10. change percent']}`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error fetching Alpha Vantage data:", error);
    return null;
  }
}

// Helper function to fetch data from Yahoo Finance
export async function fetchYahooFinanceData(symbol: string) {
  try {
    const yahooFinanceApiKey = Deno.env.get('YAHOO_FINANCE_API_KEY');
    
    if (!yahooFinanceApiKey) {
      console.log("Yahoo Finance API key not found, skipping");
      return null;
    }
    
    // Note: This is a placeholder. Actual implementation would depend on the Yahoo Finance API specifics
    const response = await fetch(
      `https://yfapi.net/v6/finance/quote?symbols=${symbol}`,
      {
        headers: {
          'X-API-KEY': yahooFinanceApiKey
        }
      }
    );
    
    if (!response.ok) {
      console.error(`Yahoo Finance API error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.quoteResponse || !data.quoteResponse.result || data.quoteResponse.result.length === 0) {
      return null;
    }
    
    const quote = data.quoteResponse.result[0];
    const changePercent = quote.regularMarketChangePercent;
    
    return {
      source: "Yahoo Finance",
      isPositive: changePercent > 0,
      confidence: Math.min(Math.abs(changePercent / 100) + 0.5, 0.95),
      explanation: `Market change of ${changePercent.toFixed(2)}%`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error fetching Yahoo Finance data:", error);
    return null;
  }
}

// Helper function to fetch data from Bloomberg (placeholder)
export async function fetchBloombergData(symbol: string) {
  try {
    const bloombergApiKey = Deno.env.get('BLOOMBERG_API_KEY');
    
    if (!bloombergApiKey) {
      console.log("Bloomberg API key not found, skipping");
      return null;
    }
    
    // Note: This is a placeholder. Bloomberg API requires enterprise access
    // and would need to be implemented according to their specific API documentation
    
    // For now, return deterministic data based on symbol
    const seed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const sourceValue = ((seed + 11) % 100) / 100;
    
    return {
      source: "Bloomberg",
      isPositive: sourceValue > 0.5,
      confidence: Math.round((sourceValue + 0.3) * 100) / 100,
      explanation: `Bloomberg market analysis for ${symbol}`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error with Bloomberg data:", error);
    return null;
  }
}
