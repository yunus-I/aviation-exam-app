"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <title>EAU Exam Practice Portal</title>
      </head>
      <body
        style={{
          margin: 0,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          background: "#F7F8FC",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: 24,
        }}
      >
        <div
          style={{
            maxWidth: 400,
            width: "100%",
            background: "#ffffff",
            padding: 28,
            borderRadius: 16,
            textAlign: "center",
            boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 12 }}>✈️</div>
          <h2 style={{ fontSize: 18, color: "#003580", margin: "0 0 8px" }}>
            EAU Exam Portal
          </h2>
          <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 20px" }}>
            The app encountered a loading error. Please refresh to continue.
          </p>
          <button
            onClick={() => {
              try { reset(); } catch { window.location.reload(); }
            }}
            style={{
              width: "100%",
              padding: "12px",
              background: "#003580",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Reload App
          </button>
        </div>
      </body>
    </html>
  );
}
