import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        // Allow Telegram to embed this app as a Mini App (iframe / webview).
        // CSP frame-ancestors is the standard directive for controlling iframe embedding.
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' https://web.telegram.org https://*.telegram.org https://webk.telegram.org https://webz.telegram.org https://t.me https://*.t.me",
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
