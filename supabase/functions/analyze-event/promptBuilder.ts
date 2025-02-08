
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

  return `Analyze this event and provide a detailed market impact analysis. Consider historical precedents, regional economic factors, and industry-specific vulnerabilities. For wildfires, consider utility companies' liability exposure, infrastructure damage risks, and regulatory implications. For natural disasters, factor in insurance costs, reconstruction needs, and supply chain disruptions. Return ONLY the following JSON structure with NO additional text or markdown:
    {
      "affected_sectors": [],
      "market_impact": "",
      "supply_chain_impact": "",
      "market_sentiment": {
        "short_term": "",
        "long_term": ""
      },
      "stock_predictions": {
        "positive": [],
        "negative": [],
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
    
    Additional Context:
    - For utility companies during wildfires, consider:
      * Historical liability costs from previous fires
      * Infrastructure damage potential
      * Regulatory risk exposure
      * Insurance coverage limitations
      * Regional economic impact
      * Emergency response capabilities
      * Grid reliability concerns
      * Public safety shutdown requirements
      * Long-term climate adaptation costs
    
    - For natural disasters:
      * Direct infrastructure damage costs
      * Insurance claim projections
      * Supply chain disruptions
      * Regional economic recovery timeline
      * Emergency response requirements
      * Reconstruction material demands
      * Labor market impacts
      * Environmental remediation needs`;
}
