
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

interface AIClassificationResult {
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  eventType: "NATURAL_DISASTER" | "GEOPOLITICAL" | "ECONOMIC" | "OTHER";
  confidence: number;
  reasoning: string;
}

/**
 * Classifies an event using AI instead of keyword matching
 */
export async function classifyEventWithAI(
  title: string, 
  description: string,
  supabaseClient: ReturnType<typeof createClient>
): Promise<{ eventType: string; severity: string; confidence: number; reasoning: string }> {
  try {
    console.log(`Classifying event with AI: ${title}`);
    
    // Call the AI classification edge function
    const { data, error } = await supabaseClient.functions.invoke('classify-event-ai', {
      body: { title, description }
    });

    if (error) {
      console.error('AI classification error:', error);
      throw new Error(`AI classification failed: ${error.message}`);
    }

    const classification = data as AIClassificationResult;
    
    // Validate confidence threshold (only accept high-confidence classifications)
    if (classification.confidence < 0.7) {
      console.log(`Low confidence AI classification (${classification.confidence}), falling back to keywords`);
      throw new Error('Low confidence classification');
    }

    console.log(`AI classification successful: ${classification.severity} (${classification.confidence})`);
    
    return {
      eventType: classification.eventType,
      severity: classification.severity,
      confidence: classification.confidence,
      reasoning: classification.reasoning
    };

  } catch (error) {
    console.error('AI classification failed, falling back to keyword-based classification:', error);
    
    // Fallback to existing keyword-based classification
    const { determineEventType, determineSeverity } = await import('./eventClassifier.ts');
    
    return {
      eventType: determineEventType(title, description),
      severity: determineSeverity(title, description),
      confidence: 0.5, // Lower confidence for keyword-based fallback
      reasoning: 'Keyword-based fallback classification'
    };
  }
}
