"use server";

import { revalidatePath } from "next/cache";
import { updateOrgCredits } from "@/lib/db/admin/organizations";

export async function addCreditsAction(orgId: string, amount: number) {
  const result = await updateOrgCredits(orgId, amount);
  if (result.ok) revalidatePath("/admin/organizations");
  return result;
}

export async function removeCreditsAction(orgId: string, amount: number) {
  const result = await updateOrgCredits(orgId, -amount);
  if (result.ok) revalidatePath("/admin/organizations");
  return result;
}
