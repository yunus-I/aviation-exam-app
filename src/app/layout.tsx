import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import "katex/dist/katex.min.css";

export const metadata: Metadata = {
  title: "EAU Exam Practice Portal",
  description:
    "Ethiopian Aviation University — Student Exam Practice Portal. Practice exam questions for all EAU departments including Aircraft Maintenance, Pilot Training, Cabin Crew, and more.",
  keywords: ["Ethiopian Aviation University", "EAU", "exam practice", "aviation", "AMT", "pilot training"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#003580",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
          Explicit viewport meta — Telegram's Android WebView sometimes ignores
          the Viewport export from Next.js and needs a literal <meta> tag.
        */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />

        {/*
          Allow Telegram to embed this app in an iframe.
          Without this some hosting environments (Vercel default headers) will
          block the frame load and the mini app silently never opens.
        */}
        <meta httpEquiv="Content-Security-Policy" content="frame-ancestors 'self' https://web.telegram.org https://*.telegram.org" />

        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Nunito:wght@600;700&display=swap"
          rel="stylesheet"
        />

        {/* Polyfills — must run before any other script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  if (typeof globalThis === 'undefined') { window.globalThis = window; }
                  if (!Object.hasOwn) {
                    Object.hasOwn = function(o, p) { return Object.prototype.hasOwnProperty.call(o, p); };
                  }
                  if (!Array.prototype.at) {
                    Array.prototype.at = function(n) {
                      n = Math.trunc(n) || 0;
                      if (n < 0) n += this.length;
                      if (n < 0 || n >= this.length) return undefined;
                      return this[n];
                    };
                  }
                  if (!String.prototype.at) {
                    String.prototype.at = function(n) {
                      n = Math.trunc(n) || 0;
                      if (n < 0) n += this.length;
                      if (n < 0 || n >= this.length) return undefined;
                      return this[n];
                    };
                  }
                  // Register Service Worker for PWA performance
                  if ('serviceWorker' in navigator) {
                    window.addEventListener('load', function() {
                      navigator.serviceWorker.register('/sw.js').catch(function() {});
                    });
                  }
                } catch (e) {}
              })();
            `,
          }}
        />

        {/*
          Telegram WebApp SDK — loaded with async so it does NOT block rendering.
          The mini-app-shell already has a retry loop to wait for initData;
          the SDK itself dispatches a custom event when it is ready.
        */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="https://telegram.org/js/telegram-web-app.js" async />

        {/*
          Call ready() + expand() as soon as the SDK script finishes loading.
          We listen for the script's own load event rather than running inline,
          which avoids the race where the inline script runs before the async
          SDK has had a chance to initialise window.Telegram.WebApp.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function initTwa() {
                  try {
                    var twa = window.Telegram && window.Telegram.WebApp;
                    if (twa) {
                      twa.ready();
                      twa.expand();
                    }
                  } catch (e) {}
                }
                // If the SDK is already loaded (cached), run immediately
                if (window.Telegram && window.Telegram.WebApp) {
                  initTwa();
                } else {
                  // Otherwise wait for the async script to finish
                  document.querySelector('script[src*="telegram-web-app"]')
                    ? document.querySelector('script[src*="telegram-web-app"]').addEventListener('load', initTwa)
                    : window.addEventListener('load', initTwa);
                }
              })();
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
