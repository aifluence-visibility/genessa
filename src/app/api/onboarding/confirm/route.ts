import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";

interface ConfirmBody {
  organization_id: string;
  domain: string;
  sector: string;
  locale: "tr-TR" | "en-US";
  kept_prompt_ids: string[];
  new_prompts: Array<{ prompt_text: string; prompt_type: string }>;
  kept_competitor_ids: string[];
  new_competitors: Array<{ competitor_name: string; competitor_url?: string | null }>;
}

const VALID_PROMPT_TYPES = new Set(["category", "solution", "comparison", "brand", "long_tail"]);

function bad(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

export async function POST(req: NextRequest) {
  // Auth check
  const serverClient = await createSupabaseServerClient();
  const { data: { user }, error: authErr } = await serverClient.auth.getUser();
  if (authErr || !user) return bad("unauthorized", 401);

  let body: ConfirmBody;
  try {
    body = await req.json();
  } catch {
    return bad("invalid_json");
  }

  const { organization_id, domain, sector, locale, kept_prompt_ids, new_prompts, kept_competitor_ids, new_competitors } = body;

  if (!organization_id || !domain) return bad("missing_fields");

  const admin = createSupabaseAdminClient();
  if (!admin) return bad("service_unavailable", 503);

  // Verify this org belongs to the user
  const { data: profile } = await admin
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.organization_id && profile.organization_id !== organization_id) {
    return bad("forbidden", 403);
  }

  // 1. Delete engine_prompts not in kept list
  const keptPrompts = Array.isArray(kept_prompt_ids) ? kept_prompt_ids.filter(Boolean) : [];
  if (keptPrompts.length > 0) {
    await admin.from("engine_prompts")
      .delete()
      .eq("organization_id", organization_id)
      .eq("is_user_approved", false)
      .not("id", "in", `(${keptPrompts.map((id) => `'${id}'`).join(",")})`);
  } else {
    // User removed all AI prompts — delete them all
    await admin.from("engine_prompts")
      .delete()
      .eq("organization_id", organization_id)
      .eq("is_user_approved", false);
  }

  // 2. Approve kept prompts
  if (keptPrompts.length > 0) {
    await admin.from("engine_prompts")
      .update({ is_user_approved: true })
      .eq("organization_id", organization_id)
      .in("id", keptPrompts);
  }

  // 3. Insert new user-added prompts (directly approved)
  const validNewPrompts = (Array.isArray(new_prompts) ? new_prompts : [])
    .filter((p) => p?.prompt_text?.trim() && VALID_PROMPT_TYPES.has(p?.prompt_type));
  if (validNewPrompts.length > 0) {
    await admin.from("engine_prompts").insert(
      validNewPrompts.map((p) => ({
        organization_id,
        prompt_text: p.prompt_text.trim(),
        prompt_type: p.prompt_type,
        target_locale: locale,
        target_engines: ["claude", "gpt", "perplexity"],
        is_active: true,
        is_user_approved: true,
      }))
    );
  }

  // 4. Delete competitors not in kept list
  const keptCompetitors = Array.isArray(kept_competitor_ids) ? kept_competitor_ids.filter(Boolean) : [];
  if (keptCompetitors.length > 0) {
    await admin.from("tracked_competitors")
      .delete()
      .eq("organization_id", organization_id)
      .eq("is_user_added", false)
      .not("id", "in", `(${keptCompetitors.map((id) => `'${id}'`).join(",")})`);
  } else {
    await admin.from("tracked_competitors")
      .delete()
      .eq("organization_id", organization_id)
      .eq("is_user_added", false);
  }

  // 5. Insert new user-added competitors
  const validNewCompetitors = (Array.isArray(new_competitors) ? new_competitors : [])
    .filter((c) => c?.competitor_name?.trim());
  if (validNewCompetitors.length > 0) {
    await admin.from("tracked_competitors").insert(
      validNewCompetitors.map((c) => ({
        organization_id,
        competitor_name: c.competitor_name.trim(),
        competitor_url: c.competitor_url?.trim() || null,
        is_user_added: true,
      }))
    );
  }

  // 6. Update profile
  const normalizedDomain = domain.trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "").toLowerCase();
  await admin.from("profiles").upsert({
    id: user.id,
    domain: normalizedDomain,
    organization_id,
    sector: sector || "other",
    onboarding_locale: locale,
  }, { onConflict: "id" });

  return NextResponse.json({ ok: true });
}
