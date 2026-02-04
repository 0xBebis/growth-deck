"use client";

import { updateCompanyProfile } from "@/app/(dashboard)/settings/actions";
import { useRef } from "react";

interface CompanyProfileFormProps {
  profile: {
    companyName: string;
    productName: string;
    productDescription: string;
    brandVoice: string;
    targetAudiences: unknown;
  } | null;
  isAdmin: boolean;
}

export function CompanyProfileForm({ profile, isAdmin }: CompanyProfileFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={updateCompanyProfile} className="max-w-2xl space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Company Name</label>
        <input
          name="companyName"
          defaultValue={profile?.companyName ?? ""}
          disabled={!isAdmin}
          className="w-full rounded-md border px-3 py-2 text-sm disabled:opacity-50"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Product Name</label>
        <input
          name="productName"
          defaultValue={profile?.productName ?? ""}
          disabled={!isAdmin}
          className="w-full rounded-md border px-3 py-2 text-sm disabled:opacity-50"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Product Description</label>
        <textarea
          name="productDescription"
          defaultValue={profile?.productDescription ?? ""}
          disabled={!isAdmin}
          rows={4}
          className="w-full rounded-md border px-3 py-2 text-sm disabled:opacity-50"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Brand Voice</label>
        <textarea
          name="brandVoice"
          defaultValue={profile?.brandVoice ?? ""}
          disabled={!isAdmin}
          rows={4}
          className="w-full rounded-md border px-3 py-2 text-sm disabled:opacity-50"
          placeholder="Describe the tone and style for AI-generated replies..."
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Target Audiences (JSON)</label>
        <textarea
          name="targetAudiences"
          defaultValue={JSON.stringify(profile?.targetAudiences ?? [], null, 2)}
          disabled={!isAdmin}
          rows={6}
          className="w-full rounded-md border px-3 py-2 font-mono text-xs disabled:opacity-50"
        />
      </div>

      {isAdmin && (
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Save Profile
        </button>
      )}
    </form>
  );
}
