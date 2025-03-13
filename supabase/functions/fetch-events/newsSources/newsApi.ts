
import type { NewsApiArticle, StandardizedArticle } from "../types.ts";

/**
 * Fetches news articles from the News API
 */
export async function fetchFromNewsApi(): Promise<StandardizedArticle[]> {
  try {
    const newsApiKey = Deno.env.get('NEWS_API_KEY');
    if (!newsApiKey) {
      console.error('NEWS_API_KEY not configured');
      return [];
    }
    
    // Use different country codes to get more variety of news (us, gb, ca)
    const countryCode = ["us", "gb", "ca"][Math.floor(Math.random() * 3)];
    
    // Add a timestamp parameter to avoid caching
    const timestamp = new Date().getTime();
    
    const newsResponse = await fetch(
      `https://newsapi.org/v2/top-headlines?country=${countryCode}&pageSize=10&_t=${timestamp}`,
      {
        headers: {
          'X-Api-Key': newsApiKey
        }
      }
    );

    if (!newsResponse.ok) {
      if (newsResponse.status === 429) {
        console.error('News API rate limit exceeded');
      } else {
        console.error(`News API error: ${newsResponse.statusText}`);
      }
      return [];
    }
    
    const newsData = await newsResponse.json();
    console.log(`Fetched ${newsData.articles?.length || 0} articles from News API for country: ${countryCode}`);
    
    if (newsData.articles && newsData.articles.length > 0) {
      // Transform News API articles to a standard format for processing
      return newsData.articles.map((article: NewsApiArticle) => ({
        title: article.title,
        description: article.description || article.content || 'No description available',
        url: article.url,
        source_api: 'NEWS_API'
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching from News API:', error);
    return [];
  }
}
