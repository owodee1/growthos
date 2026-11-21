import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "./supabase/server";

// For pages that need a signed-in user.
export async function requireUser() {
  const supabase = await createClient();
  if (!supabase) redirect("/");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return { supabase, user };
}

// Returns the person's organisation-level role, if they have one
// (super admin or group administrator), otherwise null.
export async function getOrgRole(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  return data as { organization_id: string; role: string } | null;
}
