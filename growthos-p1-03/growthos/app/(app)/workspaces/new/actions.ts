"use server";

import { redirect } from "next/navigation";
import { getOrgRole, requireUser } from "../../../../lib/auth";
import { RELATIONSHIPS, slugify } from "../../../../lib/labels";

function fail(message: string): never {
  redirect(`/workspaces/new?${new URLSearchParams({ error: message })}`);
}

export async function createWorkspace(formData: FormData) {
  const { supabase, user } = await requireUser();

  const name = String(formData.get("name") ?? "").trim();
  const relationship = String(formData.get("relationship") ?? "");
  const slug = slugify(name);

  if (!name || !slug) fail("Enter a name for the workspace.");
  if (!(RELATIONSHIPS as readonly string[]).includes(relationship)) {
    fail("Choose how this business relates to Beyond Limit.");
  }

  const org = await getOrgRole(supabase, user.id);
  if (!org) fail("Only a group administrator can create workspaces.");

  const { error } = await supabase.from("businesses").insert({
    organization_id: org.organization_id,
    name,
    slug,
    relationship,
  });

  if (error) {
    fail(
      error.code === "23505"
        ? "A workspace with that name already exists."
        : "The workspace could not be created. Try again.",
    );
  }

  redirect(`/w/${slug}`);
}
