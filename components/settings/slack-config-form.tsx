"use client";

import { updateSlackConfig } from "@/app/(dashboard)/settings/actions";

interface SlackConfigFormProps {
  config: {
    webhookUrl: string | null;
    alertChannelName: string;
    metricsChannelName: string;
    highPriorityThreshold: number;
    enableHighPriorityAlerts: boolean;
    enableDailySummary: boolean;
    enableWeeklyRecap: boolean;
    enableQueueAlerts: boolean;
    enableCalendarReminders: boolean;
  } | null;
}

export function SlackConfigForm({ config }: SlackConfigFormProps) {
  return (
    <form action={updateSlackConfig} className="max-w-2xl space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Webhook URL</label>
        <input
          name="webhookUrl"
          type="url"
          defaultValue={config?.webhookUrl ?? ""}
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder="https://hooks.slack.com/services/..."
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium">Alert Channel</label>
          <input
            name="alertChannelName"
            defaultValue={config?.alertChannelName ?? "#growth-alerts"}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Metrics Channel</label>
          <input
            name="metricsChannelName"
            defaultValue={config?.metricsChannelName ?? "#growth-metrics"}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium">High-Priority Threshold</label>
        <input
          name="highPriorityThreshold"
          type="number"
          min="0"
          max="100"
          defaultValue={config?.highPriorityThreshold ?? 80}
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Notification Toggles</h3>
        {[
          { name: "enableHighPriorityAlerts", label: "High-priority post alerts", checked: config?.enableHighPriorityAlerts ?? true },
          { name: "enableDailySummary", label: "Daily summary", checked: config?.enableDailySummary ?? true },
          { name: "enableWeeklyRecap", label: "Weekly recap", checked: config?.enableWeeklyRecap ?? true },
          { name: "enableQueueAlerts", label: "Stale queue alerts", checked: config?.enableQueueAlerts ?? true },
          { name: "enableCalendarReminders", label: "Calendar reminders", checked: config?.enableCalendarReminders ?? true },
        ].map(({ name, label, checked }) => (
          <div key={name} className="flex items-center gap-2">
            <input
              name={name}
              type="checkbox"
              defaultChecked={checked}
              className="rounded"
            />
            <label className="text-sm">{label}</label>
          </div>
        ))}
      </div>

      <button
        type="submit"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Save Slack Config
      </button>
    </form>
  );
}
