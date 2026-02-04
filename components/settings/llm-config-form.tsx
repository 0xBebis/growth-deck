"use client";

import { updateLlmConfig } from "@/app/(dashboard)/settings/actions";
import { CURATED_MODELS } from "@/lib/utils/constants";

interface LlmConfigFormProps {
  config: {
    defaultModelId: string;
    classificationTemp: number;
    draftingTemp: number;
    summarizationTemp: number;
    calendarTemp: number;
    monthlyBudgetLimit: number | null;
    budgetAlertThreshold: number;
    budgetHardStop: boolean;
  } | null;
}

export function LlmConfigForm({ config }: LlmConfigFormProps) {
  return (
    <form action={updateLlmConfig} className="max-w-2xl space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold">Default Model</h3>
        <select
          name="defaultModelId"
          defaultValue={config?.defaultModelId ?? "moonshotai/kimi-k2.5"}
          className="w-full rounded-md border px-3 py-2 text-sm"
        >
          {CURATED_MODELS.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name} — ${model.inputCost} in / ${model.outputCost} out per 1M
              {model.tag ? ` (${model.tag})` : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold">Temperature Settings</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { name: "classificationTemp", label: "Classification", defaultValue: config?.classificationTemp ?? 0.2 },
            { name: "draftingTemp", label: "Drafting", defaultValue: config?.draftingTemp ?? 0.6 },
            { name: "summarizationTemp", label: "Summarization", defaultValue: config?.summarizationTemp ?? 0.3 },
            { name: "calendarTemp", label: "Calendar", defaultValue: config?.calendarTemp ?? 0.7 },
          ].map(({ name, label, defaultValue }) => (
            <div key={name}>
              <label className="mb-1 block text-xs font-medium">{label}</label>
              <input
                name={name}
                type="number"
                step="0.1"
                min="0"
                max="2"
                defaultValue={defaultValue}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold">Budget Controls</h3>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium">Monthly Budget Limit ($)</label>
            <input
              name="monthlyBudgetLimit"
              type="number"
              step="1"
              min="0"
              defaultValue={config?.monthlyBudgetLimit ?? ""}
              placeholder="Leave empty for no limit"
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">
              Alert Threshold (0-1, e.g. 0.8 = 80%)
            </label>
            <input
              name="budgetAlertThreshold"
              type="number"
              step="0.05"
              min="0"
              max="1"
              defaultValue={config?.budgetAlertThreshold ?? 0.8}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              name="budgetHardStop"
              type="checkbox"
              defaultChecked={config?.budgetHardStop ?? true}
              className="rounded"
            />
            <label className="text-sm">
              Hard stop at 100% (blocks non-essential LLM tasks, drafting still works)
            </label>
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Save LLM Config
      </button>
    </form>
  );
}
