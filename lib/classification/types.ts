export interface ClassificationResult {
  relevanceScore: number;
  intentType: "QUESTION" | "COMPLAINT" | "DISCUSSION" | "SHOWCASE";
  audienceType: "TRADER" | "RESEARCHER" | "HYBRID";
}
