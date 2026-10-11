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
                  if (!String.prototype.replaceAll) {
                    String.prototype.replaceAll = function(searchValue, replaceValue) {
                      if (Object.prototype.toString.call(searchValue).toLowerCase() === '[object regexp]') {
                        return this.replace(searchValue, replaceValue);
                      }
                      return this.replace(new RegExp(String(searchValue).replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&'), 'g'), replaceValue);
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
                  if (!Array.prototype.flatMap) {
                    Array.prototype.flatMap = function(fn, thisArg) {
                      return Array.prototype.map.call(this, fn, thisArg).flat(1);
                    };
                  }
                  if (!Object.fromEntries) {
                    Object.fromEntries = function(entries) {
                      if (!entries) return {};
                      var obj = {};
                      for (var pair of entries) {
                        if (pair && pair.length >= 2) obj[pair[0]] = pair[1];
                      }
                      return obj;
                    };
                  }
                  if (!Promise.allSettled) {
                    Promise.allSettled = function(promises) {
                      return Promise.all(
                        Array.from(promises).map(function(p) {
                          return Promise.resolve(p).then(
                            function(value) { return { status: 'fulfilled', value: value }; },
                            function(reason) { return { status: 'rejected', reason: reason }; }
                          );
                        })
                      );
                    };
                  }
                  if (typeof crypto === 'undefined') {
                    window.crypto = {};
                  }
                  if (!window.crypto.randomUUID) {
                    window.crypto.randomUUID = function() {
                      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                        var r = (Math.random() * 16) | 0;
                        var v = c === 'x' ? r : (r & 0x3) | 0x8;
                        return v.toString(16);
                      });
                    };
                  }
                  if (typeof structuredClone !== 'function') {
                    window.structuredClone = function(obj) {
                      return JSON.parse(JSON.stringify(obj));
                    };
                  }
                  if (typeof ResizeObserver === 'undefined') {
                    window.ResizeObserver = function() {
                      this.observe = function() {};
                      this.unobserve = function() {};
                      this.disconnect = function() {};
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
                function applyTgProperties(twa) {
                  try {
                    if (twa.viewportHeight) {
                      document.documentElement.style.setProperty('--tg-viewport-height', twa.viewportHeight + 'px');
                    }
                    if (twa.viewportStableHeight) {
                      document.documentElement.style.setProperty('--tg-viewport-stable-height', twa.viewportStableHeight + 'px');
                    }
                  } catch (e) {}
                }

                function initTwa() {
                  try {
                    var twa = window.Telegram && window.Telegram.WebApp;
                    if (twa) {
                      if (typeof twa.ready === 'function') twa.ready();
                      if (typeof twa.expand === 'function') twa.expand();
                      if (typeof twa.disableVerticalSwipes === 'function') {
                        twa.disableVerticalSwipes();
                      }
                      applyTgProperties(twa);
                      if (typeof twa.onEvent === 'function') {
                        twa.onEvent('viewportChanged', function() {
                          applyTgProperties(twa);
                        });
                      }
                    }
                  } catch (e) {}
                }

                if (window.Telegram && window.Telegram.WebApp) {
                  initTwa();
                } else {
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
