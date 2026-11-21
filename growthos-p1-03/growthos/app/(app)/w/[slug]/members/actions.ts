"use server";

import { redirect } from "next/navigation";
import { getOrgRole, requireUser } from "../../../../../lib/auth";
import { MEMBER_ROLES } from "../../../../../lib/labels";

function back(slug: string, message: { error: string } | { ok: string }): never {
  redirect(`/w/${slug}/members?${new URLSearchParams(message)}`);
}

function isRole(value: string) {
  return (MEMBER_ROLES as readonly string[]).includes(value);
}

export async function addMember(formData: FormData) {
  const { supabase } = await requireUser();
  const slug = String(formData.get("slug") ?? "");
  const businessId = String(formData.get("businessId") ?? "");
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "");

  if (!email) back(slug, { error: "Enter the person’s email." });
  if (!isRole(role)) back(slug, { error: "Choose a role." });

  const { error } = await supabase.rpc("add_member_by_email", {
    p_business: businessId,
    p_email: email,
    p_role: role,
  });

  if (error) back(slug, { error: error.message });
  back(slug, { ok: `${email} now has access.` });
}

export async function changeRole(formData: FormData) {
  const { supabase, user } = await requireUser();
  const slug = String(formData.get("slug") ?? "");
  const businessId = String(formData.get("businessId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "");

  if (!isRole(role)) back(slug, { error: "Choose a role." });
  if (userId === user.id) {
    back(slug, { error: "You cannot change your own role." });
  }

  const { data, error } = await supabase
    .from("memberships")
    .update({ role })
    .eq("business_id", businessId)
    .eq("user_id", userId)
    .select("user_id");

  if (error || !data || data.length === 0) {
    back(slug, { error: "The role could not be changed." });
  }
  back(slug, { ok: "Role updated." });
}

export async function removeMember(formData: FormData) {
  const { supabase, user } = await requireUser();
  const slug = String(formData.get("slug") ?? "");
  const businessId = String(formData.get("businessId") ?? "");
  const userId = String(formData.get("userId") ?? "");

  if (userId === user.id) {
    back(slug, { error: "You cannot remove yourself." });
  }

  const { data, error } = await supabase
    .from("memberships")
    .delete()
    .eq("business_id", businessId)
    .eq("user_id", userId)
    .select("user_id");

  if (error || !data || data.length === 0) {
    back(slug, { error: "The person could not be removed." });
  }
  back(slug, { ok: "Person removed from this workspace." });
}
