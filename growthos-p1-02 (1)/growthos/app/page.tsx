import { redirect } from "next/navigation";
import { createClient } from "../lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const environment = process.env.NEXT_PUBLIC_APP_ENV ?? "local";
  const supabase = await createClient();

  let email: string | null = null;
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");
    email = user.email ?? null;
  }

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "64px 24px" }}>
      <h1 style={{ fontSize: 28, margin: "0 0 8px" }}>GrowthOS</h1>

      {supabase ? (
        <>
          <p style={{ margin: "0 0 24px" }}>
            You are signed in as <strong>{email}</strong>.
          </p>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              style={{
                padding: "10px 18px",
                fontSize: 16,
                border: "1px solid #b6bdc4",
                borderRadius: 6,
                background: "#fff",
                color: "#1b1f23",
                cursor: "pointer",
              }}
            >
              Sign out
            </button>
          </form>
        </>
      ) : (
        <p style={{ margin: "0 0 24px" }}>
          The app is running. Sign-in is not set up yet: add the Supabase
          settings in Vercel to turn it on.
        </p>
      )}

      <p style={{ margin: "32px 0 0", fontSize: 14, color: "#57606a" }}>
        Environment: {environment}
      </p>
    </main>
  );
}
