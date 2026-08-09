"use server";

import { revalidatePath } from "next/cache";
import { AIPlatformError } from "../../../lib/ai/errors";
import { businessSettingsSchema, type BusinessSettingsError, type BusinessSettingsState } from "../../../lib/business-settings/schema";
import { requireBusinessSettingsWorkspace } from "../../../lib/business-settings/workspace";

const initialError = (error: BusinessSettingsError): BusinessSettingsState => ({ success: false, error });

export async function updateBusinessSettings(_state: BusinessSettingsState, formData: FormData): Promise<BusinessSettingsState> {
  const parsed = businessSettingsSchema.safeParse({
    name: formData.get("name"),
    industry: formData.get("industry"),
    description: formData.get("description"),
    targetAudience: formData.get("targetAudience"),
    website: formData.get("website"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    address: formData.get("address"),
    city: formData.get("city"),
    state: formData.get("state"),
    country: formData.get("country"),
  });
  if (!parsed.success) {
    return initialError({
      code: "INVALID_INPUT",
      message: "Review the highlighted business details.",
      fields: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const { supabase, business, role } = await requireBusinessSettingsWorkspace({ structuredErrors: true });
    if (role !== "owner") return initialError({ code: "FORBIDDEN", message: "Only the workspace owner can update business settings." });

    const input = parsed.data;
    const { error } = await supabase.rpc("update_business_settings", {
      target_business_id: business.id,
      business_name: input.name,
      business_industry: input.industry,
      business_description: input.description || null,
      audience_description: input.targetAudience || null,
      business_website: input.website || null,
      business_phone: input.phone || null,
      business_email: input.email || null,
      business_address: input.address || null,
      business_city: input.city || null,
      business_state: input.state || null,
      business_country: input.country,
    });
    if (error?.code === "22023") return initialError({ code: "INVALID_INPUT", message: error.message });
    if (error?.code === "42501") return initialError({ code: "FORBIDDEN", message: "You do not have permission to update this workspace." });
    if (error?.code === "P0002") return initialError({ code: "BUSINESS_NOT_FOUND", message: "The business workspace could not be found." });
    if (error) throw new AIPlatformError("STORAGE_ERROR", "Business settings could not be saved.", error);

    revalidatePath("/settings/business");
    revalidatePath("/dashboard");
    revalidatePath("/strategy");
    return { success: true, error: null };
  } catch (error) {
    if (error instanceof AIPlatformError) {
      const code = ["UNAUTHENTICATED", "FORBIDDEN", "BUSINESS_NOT_FOUND", "STORAGE_ERROR"].includes(error.code)
        ? error.code as BusinessSettingsError["code"]
        : "STORAGE_ERROR";
      return initialError({ code, message: error.message });
    }
    return initialError({ code: "STORAGE_ERROR", message: "Business settings could not be saved." });
  }
}