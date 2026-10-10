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

        {/* Preconnect to fonts */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Nunito:wght@600;700&display=swap"
          rel="stylesheet"
        />

        {/* Polyfills & Service Worker Cleanup — runs first before any hydration */}
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
                  if (!Array.prototype.flat) {
                    Array.prototype.flat = function(depth) {
                      var d = depth === undefined ? 1 : Math.floor(depth);
                      return d > 0 ? Array.prototype.reduce.call(this, function(acc, val) {
                        return acc.concat(Array.isArray(val) ? val.flat(d - 1) : val);
                      }, []) : Array.prototype.slice.call(this);
                    };
                  }
                  // Unregister any legacy Service Workers to heal Android/iOS WebViews
                  if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations().then(function(registrations) {
                      for (var i = 0; i < registrations.length; i++) {
                        registrations[i].unregister();
                      }
                    }).catch(function() {});
                  }
                  // Clear legacy caches that cause white-screen freezes
                  if ('caches' in window) {
                    caches.keys().then(function(keys) {
                      for (var i = 0; i < keys.length; i++) {
                        caches.delete(keys[i]);
                      }
                    }).catch(function() {});
                  }
                } catch (e) {}
              })();
            `,
          }}
        />

        {/*
          Telegram WebApp SDK:
          Load local bundled copy first for instant, offline-resilient initialization.
          Fallback to official CDN if local file fails.
        */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="/telegram-web-app.js" />
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

                // If SDK already populated window.Telegram, signal ready immediately
                if (window.Telegram && window.Telegram.WebApp) {
                  initTwa();
                } else {
                  // Fallback: load from official CDN if local file was unavailable
                  var fallback = document.createElement('script');
                  fallback.src = 'https://telegram.org/js/telegram-web-app.js';
                  fallback.onload = initTwa;
                  document.head.appendChild(fallback);
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
