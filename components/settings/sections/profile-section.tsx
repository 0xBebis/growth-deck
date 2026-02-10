"use client";

import { useTransition } from "react";
import { updateCompanyProfile } from "@/app/(dashboard)/settings/actions";
import { FormField } from "../shared/form-field";
import type { CompanyProfile, ShowToast } from "../shared/types";

interface ProfileSectionProps {
  profile: CompanyProfile | null;
  isAdmin: boolean;
  showToast: ShowToast;
}

export function ProfileSection({ profile, isAdmin, showToast }: ProfileSectionProps) {
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await updateCompanyProfile(formData);
        showToast("success", "Company profile updated");
      } catch (e) {
        showToast("error", e instanceof Error ? e.message : "Failed to update");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Company Profile</h2>
        <p className="text-sm text-muted-foreground">
          This information is used to personalize AI-generated content
        </p>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <FormField label="Company Name" name="companyName" defaultValue={profile?.companyName} disabled={!isAdmin} />
          <FormField label="Product Name" name="productName" defaultValue={profile?.productName} disabled={!isAdmin} />
        </div>

        <FormField
          label="Product Description"
          name="productDescription"
          defaultValue={profile?.productDescription}
          disabled={!isAdmin}
          multiline
          rows={4}
          placeholder="Describe your product and what problems it solves..."
        />

        <FormField
          label="Brand Voice"
          name="brandVoice"
          defaultValue={profile?.brandVoice}
          disabled={!isAdmin}
          multiline
          rows={4}
          placeholder="Describe the tone and personality for AI-generated replies..."
          help="This guides how the AI writes - e.g., 'Friendly and technical, like a smart coworker'"
        />

        <div>
          <label className="block text-sm font-medium mb-1">Target Audiences</label>
          <p className="text-xs text-muted-foreground mb-2">
            Define your audience segments (JSON format)
          </p>
          <textarea
            name="targetAudiences"
            defaultValue={JSON.stringify(profile?.targetAudiences ?? [], null, 2)}
            disabled={!isAdmin}
            rows={6}
            className="w-full rounded-lg border bg-card px-3 py-2 font-mono text-xs disabled:opacity-50"
          />
        </div>

        {isAdmin && (
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save Changes"}
          </button>
        )}

        {!isAdmin && (
          <p className="text-xs text-muted-foreground">
            Only admins can edit company settings
          </p>
        )}
      </form>
    </div>
  );
}
