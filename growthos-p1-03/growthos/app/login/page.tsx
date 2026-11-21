"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

const field = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  fontSize: 16,
  border: "1px solid #b6bdc4",
  borderRadius: 6,
  marginTop: 6,
} as const;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const supabase = createClient();
    if (!supabase) {
      setError(
        "Sign-in is not set up yet. Add the Supabase settings in Vercel, then redeploy.",
      );
      return;
    }

    setBusy(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);

    if (signInError) {
      setError("The email or password is incorrect. Check both and try again.");
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <main style={{ maxWidth: 400, margin: "0 auto", padding: "64px 24px" }}>
      <h1 style={{ fontSize: 28, margin: "0 0 8px" }}>Sign in to GrowthOS</h1>
      <p style={{ margin: "0 0 24px", color: "#57606a" }}>
        Accounts are created by the Beyond Limit administrator.
      </p>

      <form onSubmit={onSubmit}>
        <label style={{ display: "block", marginBottom: 16 }}>
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={field}
          />
        </label>

        <label style={{ display: "block", marginBottom: 16 }}>
          Password
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={field}
          />
        </label>

        {error && (
          <p role="alert" style={{ color: "#b42318", margin: "0 0 16px" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          style={{
            padding: "10px 18px",
            fontSize: 16,
            border: 0,
            borderRadius: 6,
            background: "#1b1f23",
            color: "#fff",
            cursor: busy ? "default" : "pointer",
            opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? "Signing in" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
