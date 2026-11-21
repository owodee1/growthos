export default function Home() {
  const environment = process.env.NEXT_PUBLIC_APP_ENV ?? "local";

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "64px 24px" }}>
      <h1 style={{ fontSize: 28, margin: "0 0 8px" }}>GrowthOS</h1>
      <p style={{ margin: "0 0 24px" }}>
        Beyond Limit sales growth management system. Setup is complete and the
        app is running.
      </p>
      <p style={{ margin: 0, fontSize: 14, color: "#57606a" }}>
        Environment: {environment}
      </p>
    </main>
  );
}
