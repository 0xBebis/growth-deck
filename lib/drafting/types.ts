export interface DraftResult {
  content: string;
  modelId: string;
  cost: number;
  inputTokens: number;
  outputTokens: number;
}
