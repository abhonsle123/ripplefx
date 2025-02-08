
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
            content: 'You are a financial analysis AI that specializes in market impact predictions. You must return a valid JSON object containing exactly the fields specified, with no additional text or markdown. For stock predictions, return between 1 and 3 stocks for both positive and negative impacts.'
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
