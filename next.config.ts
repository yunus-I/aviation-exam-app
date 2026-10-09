import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        // Allow Telegram to embed this app as a Mini App (iframe).
        // This MUST be a server header — <meta http-equiv="CSP"> alone is
        // ignored by browsers when the server sends X-Frame-Options.
        // Vercel sends X-Frame-Options: SAMEORIGIN by default; we override it.
        source: "/(.*)",
        headers: [
          {
            // Remove the blanket X-Frame-Options that blocks Telegram embedding.
            // We replace it with a stricter frame-ancestors CSP below.
            key: "X-Frame-Options",
            value: "ALLOWALL",
          },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' https://web.telegram.org https://*.telegram.org",
          },
        ],
      },
      {
        // Service worker must NEVER be cached by the browser or CDN.
        // Stale service workers serving old cached HTML → black screen after deployments.
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
