import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrgRole, requireUser } from "../../../../../lib/auth";
import { MEMBER_ROLES, ROLE_LABELS } from "../../../../../lib/labels";
import {
  buttonPrimary,
  buttonSecondary,
  h1,
  input,
  muted,
  Notice,
  page,
} from "../../../../../lib/ui";
import { addMember, changeRole, removeMember } from "./actions";

export const dynamic = "force-dynamic";

type Row = {
  user_id: string;
  role: string;
  profiles:
    | { name: string; email: string | null }
    | { name: string; email: string | null }[]
    | null;
};

export default async function MembersPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { slug } = await params;
  const { error, ok } = await searchParams;
  const { supabase, user } = await requireUser();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();
  if (!business) notFound();

  const org = await getOrgRole(supabase, user.id);
  const { data: mine } = await supabase
    .from("memberships")
    .select("role")
    .eq("business_id", business.id)
    .eq("user_id", user.id)
    .maybeSingle();
  const canManage = Boolean(org) || mine?.role === "workspace_admin";

  if (!canManage) {
    return (
      <main style={page}>
        <p style={{ margin: "0 0 16px" }}>
          <Link href={`/w/${slug}`}>← {business.name}</Link>
        </p>
        <h1 style={h1}>Members</h1>
        <p>Only workspace admins can manage members.</p>
      </main>
    );
  }

  const { data } = await supabase
    .from("memberships")
    .select("user_id, role, profiles(name, email)")
    .eq("business_id", business.id)
    .order("created_at");
  const members = (data ?? []) as unknown as Row[];

  return (
    <main style={page}>
      <p style={{ margin: "0 0 16px" }}>
        <Link href={`/w/${slug}`}>← {business.name}</Link>
      </p>
      <h1 style={h1}>Members</h1>
      <p style={{ ...muted, margin: "0 0 24px" }}>
        Only people you add here can see {business.name}. Create their sign-in
        account in Supabase first, then add them by email.
      </p>

      <Notice error={error} ok={ok} />

      <h2 style={{ fontSize: 18, margin: "0 0 12px" }}>Add a person</h2>
      <form
        action={addMember}
        style={{ display: "grid", gap: 12, maxWidth: 420, marginBottom: 40 }}
      >
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="businessId" value={business.id} />
        <label>
          Email
          <input name="email" type="email" required style={input} />
        </label>
        <label>
          Role
          <select name="role" defaultValue="sales_agent" style={input}>
            {MEMBER_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </label>
        <div>
          <button type="submit" style={buttonPrimary}>
            Add person
          </button>
        </div>
      </form>

      <h2 style={{ fontSize: 18, margin: "0 0 12px" }}>
        People in this workspace ({members.length})
      </h2>

      {members.length === 0 && (
        <p style={muted}>
          No one has been added yet. Group administrators can always see this
          workspace.
        </p>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {members.map((m) => {
          const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
          const isSelf = m.user_id === user.id;
          return (
            <div
              key={m.user_id}
              style={{
                border: "1px solid #d0d7de",
                borderRadius: 8,
                padding: "14px 16px",
              }}
            >
              <div>
                <strong>{p?.name || p?.email || "Unknown person"}</strong>
                {p?.name && p?.email ? (
                  <span style={{ ...muted, fontSize: 14 }}> · {p.email}</span>
                ) : null}
                {isSelf ? (
                  <span style={{ ...muted, fontSize: 14 }}> · you</span>
                ) : null}
              </div>

              {isSelf ? (
                <div style={{ ...muted, fontSize: 14, marginTop: 4 }}>
                  {ROLE_LABELS[m.role]}
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    marginTop: 10,
                  }}
                >
                  <form action={changeRole} style={{ display: "flex", gap: 8 }}>
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="businessId" value={business.id} />
                    <input type="hidden" name="userId" value={m.user_id} />
                    <select
                      name="role"
                      defaultValue={m.role}
                      style={{ ...input, marginTop: 0, width: "auto", fontSize: 14 }}
                    >
                      {MEMBER_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                    <button type="submit" style={buttonSecondary}>
                      Save role
                    </button>
                  </form>
                  <form action={removeMember}>
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="businessId" value={business.id} />
                    <input type="hidden" name="userId" value={m.user_id} />
                    <button type="submit" style={buttonSecondary}>
                      Remove
                    </button>
                  </form>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
