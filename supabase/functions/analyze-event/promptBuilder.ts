
export function formatAffectedOrganizations(organizations: any): string {
  if (!organizations) return 'Unknown';
  
  if (Array.isArray(organizations)) {
    return organizations.join(', ');
  }
  
  if (typeof organizations === 'object') {
    return Object.values(organizations).filter(Boolean).join(', ');
  }
  
  if (typeof organizations === 'string') {
    return organizations;
  }
  
  return 'Unknown';
}

export function buildPrompt(event: any): string {
  const affectedOrgsString = formatAffectedOrganizations(event.affected_organizations);

  return `Analyze this event and provide a comprehensive market impact analysis. For stock predictions, you MUST:
    1. Use only official stock ticker symbols (e.g., 'AAPL' not 'Apple Inc.')
    2. Ensure each prediction is backed by specific market impact factors
    3. Focus on stocks with direct exposure to the event
    4. Consider both primary and secondary effects on stock prices
    5. Be HIGHLY CONSISTENT in your directional predictions

    Consider all of the following factors when predicting stock movements and market impact:

    1. Event-Specific Factors:
       - Event type and characteristics
       - Severity and scale (local vs. global impact)
       - Expected duration of impact
       - Geographic proximity to key financial/industrial centers
       - Immediate and secondary effects on business operations

    2. Sector & Industry Analysis:
       - Direct and indirect industry exposure
       - Historical sector performance during similar events
       - Supply chain vulnerabilities and dependencies
       - Competitive dynamics within affected sectors
       - Regulatory implications and compliance requirements

    3. Market & Financial Data:
       - Stock volatility and beta values
       - Price-to-earnings ratios and other key valuation metrics
       - Trading volume and liquidity metrics
       - Short interest levels and implications
       - Recent earnings reports and guidance
       - Technical analysis indicators including moving averages and support/resistance levels

    4. Macroeconomic & Sentiment Factors:
       - News and social media sentiment analysis
       - Government policy and regulatory responses
       - Interest rate and inflation impacts
       - Investor behavior patterns during similar events
       - Institutional money flows
       - Market risk appetite indicators

    5. Company-Specific Analysis:
       - Revenue exposure to affected regions/sectors
       - Supply chain resilience and diversification
       - Balance sheet strength and cash reserves
       - Market position and competitive advantages
       - Historical stock performance during similar events
       - Pending corporate events or announcements

    IMPORTANT REQUIREMENTS FOR CONFIDENCE SCORES:
    - Assign confidence scores based on quality of available data and historical precedents
    - Overall prediction score should reflect the cumulative confidence across all factors
    - Sector impact score should reflect certainty about industry-wide effects
    - Market direction score should reflect certainty about broader market moves
    - Use intermediate values (0.65, 0.75) rather than extremes unless extremely certain
    - Thoroughly justify any confidence score above 0.8 with specific factors

    Return ONLY the following JSON structure with NO additional text or markdown:
    {
      "affected_sectors": [],
      "market_impact": "",
      "supply_chain_impact": "",
      "market_sentiment": {
        "short_term": "",
        "long_term": ""
      },
      "stock_predictions": {
        "positive": [
          {
            "symbol": "TICKER",
            "rationale": "Clear explanation of positive impact with specific factors and magnitude estimates"
          }
        ],
        "negative": [
          {
            "symbol": "TICKER",
            "rationale": "Clear explanation of negative impact with specific factors and magnitude estimates"
          }
        ],
        "confidence_scores": {
          "overall_prediction": 0.5,
          "sector_impact": 0.5,
          "market_direction": 0.5
        }
      },
      "risk_level": "low",
      "analysis_metadata": {
        "confidence_factors": [],
        "uncertainty_factors": [],
        "data_quality_score": 0.5
      }
    }

    Event Details:
    Type: ${event.event_type || 'Unknown'}
    Location: ${event.city ? `${event.city}, ` : ''}${event.country || 'Unknown'}
    Description: ${event.description || 'No description provided'}
    Affected Organizations: ${affectedOrgsString}
    Severity: ${event.severity || 'Unknown'}
    
    IMPORTANT GUIDELINES FOR STOCK PREDICTIONS:
    - Use ONLY official exchange ticker symbols (e.g., 'TSLA', 'AAPL', 'MSFT')
    - Never include company names in the symbol field
    - Provide detailed rationale explaining direct causation between event and stock impact
    - Consider market liquidity and trading volumes
    - Evaluate short interest and potential squeeze scenarios
    - Account for upcoming earnings or corporate events
    - Assess technical analysis indicators
    - Factor in institutional positioning
    - Estimate realistic price change magnitudes based on event severity and company exposure`;
}
