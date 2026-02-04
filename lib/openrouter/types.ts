export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionOptions {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: "json_object" };
}

export interface ChatCompletionResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  pricing: {
    prompt: string; // cost per token as string
    completion: string;
  };
  context_length: number;
  top_provider?: {
    max_completion_tokens: number;
  };
}

export interface ModelsResponse {
  data: ModelInfo[];
}
