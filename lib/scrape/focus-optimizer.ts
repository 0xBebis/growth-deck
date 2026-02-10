import { prisma } from "@/lib/prisma";
import { sendChatCompletion } from "@/lib/openrouter/client";
import { logUsage } from "@/lib/openrouter/cost-tracker";
import { CURATED_MODELS } from "@/lib/utils/constants";
import type { Platform } from "@prisma/client";

export interface OptimizedQueries {
  [platform: string]: string[];
}

const PLATFORM_GUIDELINES: Record<Platform, string> = {
  X: `Twitter/X search tips:
- Use exact phrases with quotes: "trading bot"
- Combine with intent words: "looking for", "anyone recommend", "need help"
- Add engagement filters: min_faves:2
- Exclude noise: -hiring -job -is:retweet
- Use relevant hashtags sparingly
- Keep queries concise (under 100 chars)`,

  REDDIT: `Reddit search tips:
- Search subreddits like algotrading, MachineLearning, fintech, startups
- Use simple keyword combinations (no complex boolean)
- Focus on question-phrased content
- Good for detailed technical discussions
- Target posts from the last week`,

  LINKEDIN: `LinkedIn search tips:
- Professional tone keywords
- Industry-specific terminology
- Focus on people sharing experiences/challenges
- Business-focused pain points
- Avoid job posting keywords`,

  HN: `Hacker News search tips:
- Technical/builder community focus
- Startup/product oriented terminology
- Use programming/tech keywords
- Search both stories and comments
- Focus on "Show HN", "Ask HN" style posts`,
};

/**
 * Uses AI to convert natural language focus into optimized platform-specific search queries
 */
export async function optimizeFocusQueries(
  focus: string,
  platforms: Platform[]
): Promise<OptimizedQueries> {
  // Get company context for better optimization
  const companyProfile = await prisma.companyProfile.findFirst();
  const llmConfig = await prisma.llmConfig.findFirst();

  const modelId = llmConfig?.defaultModelId ?? "moonshotai/kimi-k2.5";

  const systemPrompt = `You are a search query optimization expert for social media listening tools.

${companyProfile?.productDescription ? `Company context: ${companyProfile.productDescription}` : ""}
${companyProfile?.targetAudiences ? `Target audiences: ${JSON.stringify(companyProfile.targetAudiences)}` : ""}

Your task: Convert a natural language focus description into optimized search queries for specific platforms.

CRITICAL RULES:
1. Generate 3-5 queries per platform
2. Each query should target different aspects or intents
3. Include intent-based queries (people asking questions, sharing problems, seeking recommendations)
4. Mix specific phrases and broader topic searches
5. Follow platform-specific best practices
6. Exclude job postings, spam, and promotions
7. Focus on finding people who might benefit from or be interested in solutions

Output ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "X": ["query1", "query2", "query3"],
  "REDDIT": ["query1", "query2", "query3"],
  "LINKEDIN": ["query1", "query2", "query3"],
  "HN": ["query1", "query2", "query3"]
}

Only include the platforms that were requested.`;

  const platformInstructions = platforms
    .map((p) => PLATFORM_GUIDELINES[p])
    .join("\n\n");

  try {
    const response = await sendChatCompletion({
      model: modelId,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Focus: "${focus}"

Generate optimized search queries for these platforms: ${platforms.join(", ")}

Platform-specific guidelines:
${platformInstructions}`,
        },
      ],
      temperature: 0.4,
      maxTokens: 1024,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No response from AI");

    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");

    const parsed = JSON.parse(jsonMatch[0]) as OptimizedQueries;

    // Log usage
    const modelInfo = CURATED_MODELS.find((m) => m.id === modelId);
    await logUsage({
      task: "SUMMARIZE", // Reusing existing task type
      modelId,
      inputTokens: response.usage?.prompt_tokens ?? 0,
      outputTokens: response.usage?.completion_tokens ?? 0,
      inputCostPerMillion: modelInfo?.inputCost ?? 0.5,
      outputCostPerMillion: modelInfo?.outputCost ?? 2.8,
      relatedEntityType: "focus_scrape",
      relatedEntityId: undefined,
    });

    // Validate and filter to requested platforms only
    const result: OptimizedQueries = {};
    for (const platform of platforms) {
      const queries = parsed[platform];
      if (Array.isArray(queries) && queries.length > 0) {
        // Filter out empty strings and limit to 5 queries
        result[platform] = queries
          .filter((q) => typeof q === "string" && q.trim().length > 0)
          .slice(0, 5);
      }

      // If no valid queries, generate fallback
      if (!result[platform] || result[platform].length === 0) {
        result[platform] = generateFallbackQueries(focus, platform);
      }
    }

    return result;
  } catch (error) {
    console.error("Focus optimization failed:", error);
    // Return fallback queries for all platforms
    const fallback: OptimizedQueries = {};
    for (const platform of platforms) {
      fallback[platform] = generateFallbackQueries(focus, platform);
    }
    return fallback;
  }
}

/**
 * Generates basic fallback queries when AI optimization fails
 */
function generateFallbackQueries(focus: string, platform: Platform): string[] {
  // Extract meaningful words (longer than 4 chars)
  const words = focus
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 4);

  // Create 2-word phrases
  const phrases: string[] = [];
  for (let i = 0; i < words.length - 1 && phrases.length < 5; i++) {
    phrases.push(`${words[i]} ${words[i + 1]}`);
  }

  // Add individual important words if we don't have enough phrases
  if (phrases.length < 3) {
    const important = words.slice(0, 3 - phrases.length);
    phrases.push(...important);
  }

  // Ensure we have at least one query
  if (phrases.length === 0) {
    phrases.push(focus.slice(0, 50));
  }

  // Platform-specific formatting
  switch (platform) {
    case "X":
      return phrases.map((p) => `"${p}" -hiring -job`);
    case "REDDIT":
    case "HN":
      return phrases;
    case "LINKEDIN":
      return phrases.map((p) => p);
    default:
      return phrases;
  }
}
