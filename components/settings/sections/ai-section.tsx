"use client";

import { useTransition } from "react";
import { updateLlmConfig } from "@/app/(dashboard)/settings/actions";
import { CURATED_MODELS } from "@/lib/utils/constants";
import type { LlmConfig, ShowToast } from "../shared/types";

interface AISectionProps {
  config: LlmConfig | null;
  showToast: ShowToast;
}

export function AISection({ config, showToast }: AISectionProps) {
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await updateLlmConfig(formData);
        showToast("success", "AI settings updated");
      } catch (e) {
        showToast("error", e instanceof Error ? e.message : "Failed to update");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">AI & Models</h2>
        <p className="text-sm text-muted-foreground">
          Configure the AI models and parameters used for content generation
        </p>
      </div>

      <form action={handleSubmit} className="space-y-6">
        {/* API Configuration Note */}
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <h3 className="text-sm font-medium text-blue-400 mb-1">API Configuration</h3>
          <p className="text-xs text-blue-300">
            The OpenRouter API key is configured via the <code className="px-1.5 py-0.5 bg-blue-500/20 rounded-md">OPENROUTER_API_KEY</code> environment variable.
            Set this in your deployment environment or <code className="px-1.5 py-0.5 bg-blue-500/20 rounded-md">.env.local</code> file.
          </p>
        </div>

        {/* Model Selection */}
        <div className="rounded-xl glass p-4">
          <h3 className="text-sm font-medium mb-3 text-foreground">Default Model</h3>
          <select
            name="defaultModelId"
            defaultValue={config?.defaultModelId ?? "moonshotai/kimi-k2.5"}
            className="w-full rounded-lg glass border-border/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {CURATED_MODELS.map((model) => (
              <option key={model.id} value={model.id} className="bg-popover text-popover-foreground">
                {model.name} — ${model.inputCost}/${model.outputCost} per 1M tokens
                {model.tag ? ` (${model.tag})` : ""}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground mt-2">
            Used for classification and reply drafting
          </p>
        </div>

        {/* Temperature Settings */}
        <div className="rounded-xl glass p-4">
          <h3 className="text-sm font-medium mb-3 text-foreground">Temperature Settings</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Lower values = more deterministic, higher values = more creative
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { name: "classificationTemp", label: "Classification", value: config?.classificationTemp ?? 0.2, help: "For categorizing posts" },
              { name: "draftingTemp", label: "Drafting", value: config?.draftingTemp ?? 0.6, help: "For writing replies" },
              { name: "summarizationTemp", label: "Summarization", value: config?.summarizationTemp ?? 0.3, help: "For summarizing content" },
              { name: "calendarTemp", label: "Calendar", value: config?.calendarTemp ?? 0.7, help: "For content planning" },
            ].map((t) => (
              <div key={t.name}>
                <label className="block text-xs font-medium mb-1 text-foreground">{t.label}</label>
                <input
                  name={t.name}
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  defaultValue={t.value}
                  className="w-full rounded-lg glass border-border/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-[10px] text-muted-foreground mt-1">{t.help}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Budget Controls */}
        <div className="rounded-xl glass p-4">
          <h3 className="text-sm font-medium mb-3 text-foreground">Budget Controls</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1 text-foreground">Monthly Limit ($)</label>
                <input
                  name="monthlyBudgetLimit"
                  type="number"
                  step="1"
                  min="0"
                  defaultValue={config?.monthlyBudgetLimit ?? ""}
                  placeholder="No limit"
                  className="w-full rounded-lg glass border-border/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-foreground">Alert at (%)</label>
                <input
                  name="budgetAlertThreshold"
                  type="number"
                  step="5"
                  min="0"
                  max="100"
                  defaultValue={(config?.budgetAlertThreshold ?? 0.8) * 100}
                  className="w-full rounded-lg glass border-border/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <label className="flex items-center gap-2">
              <input
                name="budgetHardStop"
                type="checkbox"
                defaultChecked={config?.budgetHardStop ?? true}
                className="rounded border-border/50"
              />
              <span className="text-sm text-foreground">Hard stop at 100% (drafting still works)</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-smooth glow-sm"
        >
          {isPending ? "Saving..." : "Save AI Settings"}
        </button>
      </form>
    </div>
  );
}
