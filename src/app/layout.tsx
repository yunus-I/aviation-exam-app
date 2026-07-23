import type { Metadata, Viewport } from "next";
import Script from "next/script";
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Nunito:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="afterInteractive" />
      </head>
      <body>{children}</body>
    </html>
  );
}
