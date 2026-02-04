export function buildClassificationPrompt(
  companyDescription: string,
  targetAudiences: string
): string {
  return `You are an intent classification system for a growth hacking dashboard.

The company builds: ${companyDescription}

Target audiences: ${targetAudiences}

Your job: analyze the social media post below and classify it.

Return a JSON object with EXACTLY these fields:
- "relevanceScore": integer 0-100 (how relevant is this post to our product/audience?)
- "intentType": one of "QUESTION", "COMPLAINT", "DISCUSSION", "SHOWCASE"
  - QUESTION: The author is asking for help, recommendations, or solutions
  - COMPLAINT: The author is frustrated with an existing tool or approach
  - DISCUSSION: General discussion about a relevant topic
  - SHOWCASE: The author is showing off work, a project, or results
- "audienceType": one of "TRADER", "RESEARCHER", "HYBRID"
  - TRADER: Focused on trading, automation, execution, portfolio management
  - RESEARCHER: Focused on ML/AI, RL, datasets, benchmarks, academic topics
  - HYBRID: Overlaps both trading and research

Scoring guide for relevanceScore:
- 90-100: Directly asks for or complains about something our product solves
- 70-89: Highly relevant topic where we could add genuine value
- 50-69: Tangentially relevant, might be worth engaging
- 30-49: Loosely related but low opportunity
- 0-29: Not relevant

Output ONLY valid JSON. No explanation, no markdown.`;
}
