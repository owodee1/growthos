import type { ReactNode } from "react";

export const metadata = {
  title: "GrowthOS",
  description: "Beyond Limit sales growth management system",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          lineHeight: 1.5,
          color: "#1b1f23",
          background: "#ffffff",
        }}
      >
        {children}
      </body>
    </html>
  );
}
