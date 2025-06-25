
// Enhanced functions to determine event type and severity with much higher accuracy

/**
 * Determines the event type based on comprehensive keyword analysis
 */
export function determineEventType(title: string, description: string): "NATURAL_DISASTER" | "GEOPOLITICAL" | "ECONOMIC" | "OTHER" {
  const text = (title + " " + description).toLowerCase();
  
  // Natural disasters - comprehensive keywords
  const naturalDisasterKeywords = [
    'earthquake', 'tsunami', 'hurricane', 'typhoon', 'cyclone', 'tornado', 'flood', 'flooding',
    'wildfire', 'forest fire', 'drought', 'volcano', 'volcanic', 'eruption', 'landslide',
    'avalanche', 'blizzard', 'ice storm', 'heat wave', 'extreme weather', 'natural disaster',
    'storm surge', 'mudslide', 'sinkhole', 'meteorite', 'asteroid'
  ];
  
  // Geopolitical events - comprehensive keywords
  const geopoliticalKeywords = [
    'war', 'conflict', 'invasion', 'military', 'troops', 'battle', 'combat', 'attack',
    'treaty', 'peace agreement', 'ceasefire', 'sanctions', 'embargo', 'diplomatic',
    'election', 'vote', 'ballot', 'campaign', 'government', 'parliament', 'congress',
    'political', 'coup', 'revolution', 'protest', 'demonstration', 'riot', 'civil unrest',
    'terrorism', 'terrorist', 'security threat', 'national security', 'border', 'refugee',
    'alliance', 'nato', 'un security council', 'united nations', 'trade war'
  ];
  
  // Economic events - comprehensive keywords  
  const economicKeywords = [
    'stock market', 'dow jones', 'nasdaq', 's&p 500', 'market crash', 'recession',
    'inflation', 'deflation', 'interest rate', 'federal reserve', 'fed', 'central bank',
    'gdp', 'unemployment', 'job market', 'earnings', 'financial', 'banking', 'credit',
    'debt', 'bankruptcy', 'merger', 'acquisition', 'ipo', 'stock price', 'trading',
    'commodity', 'oil price', 'gold price', 'currency', 'exchange rate', 'forex',
    'economic growth', 'fiscal policy', 'monetary policy', 'trade deficit', 'budget'
  ];
  
  // Count matches for each category
  const naturalCount = naturalDisasterKeywords.filter(keyword => text.includes(keyword)).length;
  const geopoliticalCount = geopoliticalKeywords.filter(keyword => text.includes(keyword)).length;
  const economicCount = economicKeywords.filter(keyword => text.includes(keyword)).length;
  
  // Return the category with the highest match count
  if (naturalCount > geopoliticalCount && naturalCount > economicCount && naturalCount > 0) {
    return "NATURAL_DISASTER";
  } else if (geopoliticalCount > economicCount && geopoliticalCount > 0) {
    return "GEOPOLITICAL";
  } else if (economicCount > 0) {
    return "ECONOMIC";
  }
  
  return "OTHER";
}

/**
 * Determines severity with much higher accuracy - Critical events only for extremely important information
 */
export function determineSeverity(title: string, description: string): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
  const text = (title + " " + description).toLowerCase();
  
  // CRITICAL - Only for truly catastrophic, world-changing events
  const criticalKeywords = [
    'nuclear war', 'nuclear attack', 'nuclear disaster', 'nuclear meltdown',
    'world war', 'global war', 'major earthquake', '9.0 earthquake', 'magnitude 8', 'magnitude 9',
    'global pandemic', 'pandemic declared', 'stock market crash', 'market collapse',
    'economic collapse', 'financial crisis', 'great recession', 'depression',
    'assassination', 'terrorist attack', 'mass shooting', 'bombing', 'explosion',
    'cyber attack', 'national emergency', 'state of emergency declared',
    'tsunami warning', 'category 5 hurricane', 'superstorm', 'mega disaster',
    'coup attempt', 'government overthrow', 'civil war', 'revolution',
    'oil embargo', 'supply chain collapse', 'infrastructure failure'
  ];
  
  // HIGH - Significant events with major impact
  const highKeywords = [
    'major', 'significant', 'serious', 'severe', 'substantial', 'considerable',
    'large-scale', 'widespread', 'extensive', 'massive', 'huge', 'enormous',
    'critical infrastructure', 'power outage', 'blackout', 'internet outage',
    'trade war', 'sanctions imposed', 'diplomatic crisis', 'border closure',
    'market volatility', 'earnings miss', 'profit warning', 'layoffs announced',
    'factory explosion', 'chemical spill', 'oil spill', 'environmental disaster',
    'political scandal', 'corruption charges', 'impeachment', 'resignation',
    'cyber breach', 'data breach', 'security incident', 'hack attack'
  ];
  
  // MEDIUM - Notable events with moderate impact
  const mediumKeywords = [
    'moderate', 'notable', 'important', 'concerning', 'worrying', 'troubling',
    'unexpected', 'surprising', 'unusual', 'irregular', 'abnormal',
    'policy change', 'regulation update', 'law passed', 'court ruling',
    'merger announced', 'partnership', 'joint venture', 'acquisition bid',
    'protest', 'demonstration', 'strike', 'labor dispute', 'union action',
    'weather warning', 'storm warning', 'flood warning', 'heat advisory'
  ];
  
  // Count critical matches first - must be very specific
  const criticalCount = criticalKeywords.filter(keyword => text.includes(keyword)).length;
  if (criticalCount > 0) {
    // Additional validation for critical events - must also have impact indicators
    const impactIndicators = [
      'global', 'worldwide', 'international', 'national', 'major cities',
      'millions affected', 'thousands dead', 'billions in damage',
      'unprecedented', 'historic', 'worst in decades', 'never seen before'
    ];
    
    const hasImpactIndicator = impactIndicators.some(indicator => text.includes(indicator));
    if (hasImpactIndicator || criticalCount >= 2) {
      return "CRITICAL";
    }
  }
  
  // Check for HIGH severity
  const highCount = highKeywords.filter(keyword => text.includes(keyword)).length;
  if (highCount > 0 || text.includes('breaking:') || text.includes('urgent:')) {
    return "HIGH";
  }
  
  // Check for MEDIUM severity
  const mediumCount = mediumKeywords.filter(keyword => text.includes(keyword)).length;
  if (mediumCount > 0) {
    return "MEDIUM";
  }
  
  // Default to LOW for routine news
  return "LOW";
}

/**
 * Additional validation to ensure event classification accuracy
 */
export function validateEventClassification(title: string, description: string, severity: string): boolean {
  const text = (title + " " + description).toLowerCase();
  
  // Critical events must meet stricter criteria
  if (severity === "CRITICAL") {
    // Must have significant scope indicators
    const scopeIndicators = [
      'global', 'worldwide', 'international', 'national', 'multiple countries',
      'entire region', 'major cities', 'metropolitan area', 'nationwide'
    ];
    
    // Must have magnitude indicators
    const magnitudeIndicators = [
      'unprecedented', 'historic', 'record-breaking', 'worst in', 'largest ever',
      'millions', 'thousands dead', 'billions in damage', 'catastrophic',
      'devastating', 'apocalyptic', 'cataclysmic'
    ];
    
    const hasScope = scopeIndicators.some(indicator => text.includes(indicator));
    const hasMagnitude = magnitudeIndicators.some(indicator => text.includes(indicator));
    
    return hasScope && hasMagnitude;
  }
  
  return true;
}
