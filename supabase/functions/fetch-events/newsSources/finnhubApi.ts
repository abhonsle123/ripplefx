
import type { FinnhubNewsArticle, StandardizedArticle } from "../types.ts";

/**
 * Fetches news articles from the Finnhub API
 */
export async function fetchFromFinnhubApi(): Promise<StandardizedArticle[]> {
  try {
    const finnhubApiKey = Deno.env.get('FINNHUB_API_KEY');
    if (!finnhubApiKey) {
      console.error('FINNHUB_API_KEY not configured');
      return [];
    }
    
    // Add a timestamp parameter to avoid caching
    const timestamp = new Date().getTime();
    
    const finnhubResponse = await fetch(
      `https://finnhub.io/api/v1/news?category=general&token=${finnhubApiKey}&_t=${timestamp}`
    );

    if (!finnhubResponse.ok) {
      console.error(`Finnhub API error: ${finnhubResponse.statusText}`);
      return [];
    }
    
    const finnhubData = await finnhubResponse.json();
    console.log(`Fetched ${finnhubData?.length || 0} articles from Finnhub API`);
    
    if (finnhubData && finnhubData.length > 0) {
      // Transform Finnhub articles to a standard format for processing
      return finnhubData.map((article: FinnhubNewsArticle) => ({
        title: article.headline,
        description: article.summary || 'No description available',
        url: article.url,
        source_api: 'FINNHUB_API'
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching from Finnhub API:', error);
    return [];
  }
}
