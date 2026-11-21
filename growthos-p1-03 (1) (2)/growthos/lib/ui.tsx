import type { CSSProperties, ReactNode } from "react";

export const page: CSSProperties = {
  maxWidth: 720,
  margin: "0 auto",
  padding: "40px 24px 64px",
};

export const h1: CSSProperties = { fontSize: 26, margin: "0 0 8px" };
export const muted: CSSProperties = { color: "#57606a" };

export const input: CSSProperties = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  fontSize: 16,
  border: "1px solid #b6bdc4",
  borderRadius: 6,
  marginTop: 6,
  background: "#fff",
  color: "#1b1f23",
};

export const buttonPrimary: CSSProperties = {
  padding: "10px 18px",
  fontSize: 16,
  border: 0,
  borderRadius: 6,
  background: "#1b1f23",
  color: "#fff",
  cursor: "pointer",
};

export const buttonSecondary: CSSProperties = {
  padding: "8px 14px",
  fontSize: 14,
  border: "1px solid #b6bdc4",
  borderRadius: 6,
  background: "#fff",
  color: "#1b1f23",
  cursor: "pointer",
};

export const card: CSSProperties = {
  display: "block",
  padding: "16px 18px",
  border: "1px solid #d0d7de",
  borderRadius: 8,
  color: "inherit",
  textDecoration: "none",
  background: "#fff",
};

export function Notice({
  error,
  ok,
}: {
  error?: string;
  ok?: string;
}): ReactNode {
  if (!error && !ok) return null;
  const isError = Boolean(error);
  return (
    <p
      role={isError ? "alert" : "status"}
      style={{
        margin: "0 0 20px",
        padding: "10px 12px",
        borderRadius: 6,
        border: `1px solid ${isError ? "#f1aeb5" : "#a3d9b1"}`,
        background: isError ? "#fdecee" : "#e9f7ee",
        color: isError ? "#8a1c2b" : "#16602b",
      }}
    >
      {error ?? ok}
    </p>
  );
}
