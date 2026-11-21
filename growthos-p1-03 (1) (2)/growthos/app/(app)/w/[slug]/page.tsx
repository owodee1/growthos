import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrgRole, requireUser } from "../../../../lib/auth";
import { RELATIONSHIP_LABELS, ROLE_LABELS } from "../../../../lib/labels";
import { card, h1, muted, page } from "../../../../lib/ui";

export const dynamic = "force-dynamic";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { supabase, user } = await requireUser();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, slug, relationship, status")
    .eq("slug", slug)
    .maybeSingle();

  // A workspace you cannot access looks the same as one that does not exist.
  if (!business) notFound();

  const org = await getOrgRole(supabase, user.id);
  const { data: membership } = await supabase
    .from("memberships")
    .select("role")
    .eq("business_id", business.id)
    .eq("user_id", user.id)
    .maybeSingle();

  const roleLabel = membership
    ? ROLE_LABELS[membership.role]
    : org
      ? ROLE_LABELS[org.role]
      : "";
  const canManage = Boolean(org) || membership?.role === "workspace_admin";

  return (
    <main style={page}>
      <p style={{ margin: "0 0 16px" }}>
        <Link href="/">← All workspaces</Link>
      </p>
      <h1 style={h1}>{business.name}</h1>
      <p style={{ ...muted, margin: "0 0 24px" }}>
        {RELATIONSHIP_LABELS[business.relationship] ?? business.relationship}
        {business.status !== "active" ? ` · ${business.status}` : ""}
        {roleLabel ? ` · Your role: ${roleLabel}` : ""}
      </p>

      <div style={{ display: "grid", gap: 12 }}>
        {canManage && (
          <Link href={`/w/${business.slug}/members`} style={card}>
            <strong>Members</strong>
            <div style={{ ...muted, fontSize: 14, marginTop: 2 }}>
              Add people to this workspace and set their roles.
            </div>
          </Link>
        )}
      </div>

      <p style={{ ...muted, marginTop: 32 }}>
        Leads and the pipeline are built in the next tickets.
      </p>
    </main>
  );
}
