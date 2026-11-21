import Link from "next/link";
import type { ReactNode } from "react";
import { createClient } from "../../lib/supabase/server";
import { buttonSecondary } from "../../lib/ui";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  return (
    <>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          padding: "12px 24px",
          borderBottom: "1px solid #d0d7de",
        }}
      >
        <Link
          href="/"
          style={{ fontWeight: 600, color: "inherit", textDecoration: "none" }}
        >
          GrowthOS
        </Link>

        {user && (
          <form
            action="/auth/signout"
            method="post"
            style={{ display: "flex", alignItems: "center", gap: 12 }}
          >
            <span style={{ fontSize: 14, color: "#57606a" }}>{user.email}</span>
            <button type="submit" style={buttonSecondary}>
              Sign out
            </button>
          </form>
        )}
      </header>
      {children}
    </>
  );
}
