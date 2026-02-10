"use client";

import { useTransition } from "react";
import { updateSlackConfig } from "@/app/(dashboard)/settings/actions";
import { FormField } from "../shared/form-field";
import type { SlackConfig, ShowToast } from "../shared/types";

interface IntegrationsSectionProps {
  config: SlackConfig | null;
  showToast: ShowToast;
}

export function IntegrationsSection({ config, showToast }: IntegrationsSectionProps) {
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await updateSlackConfig(formData);
        showToast("success", "Slack settings updated");
      } catch (e) {
        showToast("error", e instanceof Error ? e.message : "Failed to update");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Integrations</h2>
        <p className="text-sm text-muted-foreground">
          Connect external services for notifications and automation
        </p>
      </div>

      <form action={handleSubmit} className="space-y-6">
        {/* Slack */}
        <div className="rounded-xl glass p-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">💬</span>
            <h3 className="text-sm font-medium text-foreground">Slack</h3>
          </div>

          <div className="space-y-4">
            <FormField
              label="Webhook URL"
              name="webhookUrl"
              defaultValue={config?.webhookUrl || ""}
              placeholder="https://hooks.slack.com/services/..."
              help="Create an incoming webhook in your Slack workspace"
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Alert Channel" name="alertChannelName" defaultValue={config?.alertChannelName || "#growth-alerts"} />
              <FormField label="Metrics Channel" name="metricsChannelName" defaultValue={config?.metricsChannelName || "#growth-metrics"} />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1 text-foreground">High Priority Threshold</label>
              <input
                name="highPriorityThreshold"
                type="number"
                min="0"
                max="100"
                defaultValue={config?.highPriorityThreshold ?? 80}
                className="w-32 rounded-lg glass border-border/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground mt-1">Posts above this score trigger alerts</p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">Notifications</p>
              {[
                { name: "enableHighPriorityAlerts", label: "High-priority post alerts", checked: config?.enableHighPriorityAlerts ?? true },
                { name: "enableDailySummary", label: "Daily summary", checked: config?.enableDailySummary ?? true },
                { name: "enableWeeklyRecap", label: "Weekly recap", checked: config?.enableWeeklyRecap ?? true },
                { name: "enableQueueAlerts", label: "Queue alerts (stale drafts)", checked: config?.enableQueueAlerts ?? true },
                { name: "enableCalendarReminders", label: "Calendar reminders", checked: config?.enableCalendarReminders ?? true },
              ].map((n) => (
                <label key={n.name} className="flex items-center gap-2">
                  <input name={n.name} type="checkbox" defaultChecked={n.checked} className="rounded border-border/50" />
                  <span className="text-sm text-foreground">{n.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-smooth glow-sm"
        >
          {isPending ? "Saving..." : "Save Integrations"}
        </button>
      </form>
    </div>
  );
}
