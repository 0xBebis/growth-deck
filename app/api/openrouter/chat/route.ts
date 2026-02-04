import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sendChatCompletion } from "@/lib/openrouter/client";
import { checkBudget } from "@/lib/openrouter/budget";
import { logUsage } from "@/lib/openrouter/cost-tracker";
import { CURATED_MODELS } from "@/lib/utils/constants";

const ALLOWED_MODEL_IDS = new Set(CURATED_MODELS.map((m) => m.id));
const MAX_TOKENS_LIMIT = 4096;

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();

    // Validate required fields
    if (!body.model || typeof body.model !== "string") {
      return NextResponse.json({ error: "model is required" }, { status: 400 });
    }
    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json({ error: "messages array is required" }, { status: 400 });
    }

    // Restrict to curated models only
    if (!ALLOWED_MODEL_IDS.has(body.model)) {
      return NextResponse.json(
        { error: `Model not allowed. Use one of: ${[...ALLOWED_MODEL_IDS].join(", ")}` },
        { status: 400 }
      );
    }

    // Validate messages structure
    for (const msg of body.messages) {
      if (!msg.role || !msg.content || typeof msg.content !== "string") {
        return NextResponse.json({ error: "Each message must have role and content" }, { status: 400 });
      }
      if (!["system", "user", "assistant"].includes(msg.role)) {
        return NextResponse.json({ error: `Invalid role: ${msg.role}` }, { status: 400 });
      }
    }

    // Budget check
    const budget = await checkBudget("chat");
    if (!budget.allowed) {
      return NextResponse.json({ error: budget.reason }, { status: 429 });
    }

    // Enforce token limit
    const maxTokens = Math.min(
      typeof body.maxTokens === "number" ? body.maxTokens : 1024,
      MAX_TOKENS_LIMIT
    );

    const result = await sendChatCompletion({
      model: body.model,
      messages: body.messages,
      temperature: typeof body.temperature === "number"
        ? Math.min(Math.max(body.temperature, 0), 2)
        : 0.6,
      maxTokens,
    });

    // Log usage for cost tracking
    const modelInfo = CURATED_MODELS.find((m) => m.id === body.model);
    if (modelInfo && result.usage) {
      await logUsage({
        task: "DRAFT",
        modelId: body.model,
        inputTokens: result.usage.prompt_tokens ?? 0,
        outputTokens: result.usage.completion_tokens ?? 0,
        inputCostPerMillion: modelInfo.inputCost,
        outputCostPerMillion: modelInfo.outputCost,
      }).catch(console.error);
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
