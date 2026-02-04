import type { ModelInfo, ModelsResponse } from "./types";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

let cachedModels: ModelInfo[] | null = null;
let cacheTimestamp = 0;

export async function fetchModels(): Promise<ModelInfo[]> {
  if (cachedModels && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedModels;
  }

  const response = await fetch(`${OPENROUTER_BASE}/models`, {
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.status}`);
  }

  const data: ModelsResponse = await response.json();
  cachedModels = data.data;
  cacheTimestamp = Date.now();
  return cachedModels;
}

export function invalidateModelCache() {
  cachedModels = null;
  cacheTimestamp = 0;
}
