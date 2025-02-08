
import { ImpactAnalysis } from "./types.ts";
import { validateAndNormalizeAnalysis } from "./validation.ts";
import { getDefaultAnalysis } from "./defaultAnalysis.ts";
import { buildPrompt } from "./promptBuilder.ts";

const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');

export async function generateAnalysis(event: any): Promise<ImpactAnalysis> {
  if (!perplexityApiKey) {
    throw new Error('Perplexity API key is not configured');
  }

  const prompt = buildPrompt(event);
  console.log("Sending request to Perplexity with prompt:", prompt);

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a financial market analysis AI specializing in predicting market impacts from events, especially natural disasters and infrastructure-related incidents. Your analysis must consider historical precedents, regional economic factors, and industry-specific vulnerabilities. For utility companies during wildfires, factor in historical liability costs, regulatory risks, and infrastructure damage potential. Always maintain strict JSON format in responses with exactly the requested fields. For stock predictions, identify 1-3 most impacted companies in both positive and negative categories with high confidence.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Perplexity API error:", errorData);
      throw new Error(`Perplexity API error: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    console.log("Raw Perplexity response:", JSON.stringify(data, null, 2));

    if (!data.choices?.[0]?.message?.content) {
      console.error("Invalid response structure:", data);
      throw new Error("Invalid response format from Perplexity");
    }

    let cleanContent = data.choices[0].message.content.trim();
    cleanContent = cleanContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    cleanContent = cleanContent.replace(/,(\s*[}\]])/g, '$1');
    
    console.log("Cleaned content before parsing:", cleanContent);

    try {
      const analysis = JSON.parse(cleanContent);
      return validateAndNormalizeAnalysis(analysis);
    } catch (error) {
      console.error("JSON parse error:", error);
      console.error("Content that failed to parse:", cleanContent);
      return getDefaultAnalysis();
    }
  } catch (error) {
    console.error("Error in generateAnalysis:", error);
    return getDefaultAnalysis();
  }
}
