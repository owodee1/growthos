import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { getOrgRole } from "../../lib/auth";
import { RELATIONSHIP_LABELS } from "../../lib/labels";
import { buttonPrimary, card, h1, muted, page } from "../../lib/ui";

export const dynamic = "force-dynamic";

export default async function Home() {
  const environment = process.env.NEXT_PUBLIC_APP_ENV ?? "local";
  const supabase = await createClient();

  if (!supabase) {
    return (
      <main style={page}>
        <h1 style={h1}>GrowthOS</h1>
        <p>
          The app is running. Sign-in is not set up yet: add the Supabase
          settings in Vercel to turn it on.
        </p>
        <p style={{ ...muted, fontSize: 14 }}>Environment: {environment}</p>
      </main>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const org = await getOrgRole(supabase, user.id);

  const { data: businesses, error } = await supabase
    .from("businesses")
    .select("id, name, slug, relationship, status")
    .order("name");

  const tablesMissing = error?.code === "42P01" || error?.code === "PGRST205";

  return (
    <main style={page}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <h1 style={h1}>Workspaces</h1>
        {org && (
          <Link
            href="/workspaces/new"
            style={{ ...buttonPrimary, textDecoration: "none" }}
          >
            New workspace
          </Link>
        )}
      </div>

      {tablesMissing && (
        <p>
          The database is not set up yet. Run the migration file in Supabase
          (see the README, ticket P1-03).
        </p>
      )}

      {!tablesMissing && (businesses ?? []).length === 0 && (
        <p style={muted}>
          {org
            ? "No workspaces yet. Create the first one."
            : "You are not in any workspace yet. Ask the administrator to add you."}
        </p>
      )}

      <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
        {(businesses ?? []).map((b) => (
          <Link key={b.id} href={`/w/${b.slug}`} style={card}>
            <strong>{b.name}</strong>
            <div style={{ ...muted, fontSize: 14, marginTop: 2 }}>
              {RELATIONSHIP_LABELS[b.relationship] ?? b.relationship}
              {b.status !== "active" ? ` · ${b.status}` : ""}
            </div>
          </Link>
        ))}
      </div>

      <p style={{ ...muted, fontSize: 14, marginTop: 40 }}>
        Environment: {environment}
      </p>
    </main>
  );
}
