import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "EAU Entrance Prep",
  description:
    "Telegram Mini App for Ethiopian Aviation University entrance exam preparation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
