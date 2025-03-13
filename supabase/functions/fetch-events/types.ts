
// Types for news API responses and standardized articles
export type NewsApiArticle = {
  title: string;
  description: string;
  source: {
    name: string;
  };
  url: string;
  publishedAt: string;
  content: string;
};

export type FinnhubNewsArticle = {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
};

export type StandardizedArticle = {
  title: string;
  description: string;
  url: string;
  source_api: string;
};

export type RequestBody = {
  source?: string;
  forceRefresh?: boolean;
};
