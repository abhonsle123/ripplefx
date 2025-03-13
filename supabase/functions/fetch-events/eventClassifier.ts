
// Functions to determine event type and severity based on content analysis

/**
 * Determines the event type based on keywords in the title and description
 */
export function determineEventType(title: string, description: string): "NATURAL_DISASTER" | "GEOPOLITICAL" | "ECONOMIC" | "OTHER" {
  const text = (title + " " + description).toLowerCase();
  
  if (text.match(/earthquake|flood|hurricane|tsunami|storm|disaster|wildfire|drought/)) {
    return "NATURAL_DISASTER";
  } else if (text.match(/war|conflict|treaty|political|election|government|military/)) {
    return "GEOPOLITICAL";
  } else if (text.match(/stock|market|economy|inflation|recession|gdp|interest rate|fed|financial/)) {
    return "ECONOMIC";
  }
  
  return "OTHER";
}

/**
 * Determines the severity based on keywords in the title and description
 */
export function determineSeverity(title: string, description: string): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
  const text = (title + " " + description).toLowerCase();
  
  if (text.match(/catastrophic|devastating|critical|emergency|crisis|severe|deadly/)) {
    return "CRITICAL";
  } else if (text.match(/major|significant|serious|dangerous|threat/)) {
    return "HIGH";
  } else if (text.match(/moderate|concerning|warning|alert/)) {
    return "MEDIUM";
  }
  
  return "LOW";
}
