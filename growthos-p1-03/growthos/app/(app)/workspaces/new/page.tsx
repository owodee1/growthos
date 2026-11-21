import Link from "next/link";
import { getOrgRole, requireUser } from "../../../../lib/auth";
import { RELATIONSHIP_LABELS, RELATIONSHIPS } from "../../../../lib/labels";
import { buttonPrimary, h1, input, muted, Notice, page } from "../../../../lib/ui";
import { createWorkspace } from "./actions";

export const dynamic = "force-dynamic";

export default async function NewWorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { supabase, user } = await requireUser();
  const org = await getOrgRole(supabase, user.id);

  return (
    <main style={page}>
      <p style={{ margin: "0 0 16px" }}>
        <Link href="/">← All workspaces</Link>
      </p>
      <h1 style={h1}>New workspace</h1>
      <p style={{ ...muted, margin: "0 0 24px" }}>
        A workspace is one business with its own leads, pipeline and team.
      </p>

      <Notice error={error} />

      {!org ? (
        <p>Only a group administrator can create workspaces.</p>
      ) : (
        <form action={createWorkspace} style={{ maxWidth: 420 }}>
          <label style={{ display: "block", marginBottom: 16 }}>
            Business name
            <input name="name" required style={input} />
          </label>

          <label style={{ display: "block", marginBottom: 24 }}>
            Relationship to Beyond Limit
            <select name="relationship" defaultValue="client" style={input}>
              {RELATIONSHIPS.map((r) => (
                <option key={r} value={r}>
                  {RELATIONSHIP_LABELS[r]}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" style={buttonPrimary}>
            Create workspace
          </button>
        </form>
      )}
    </main>
  );
}
