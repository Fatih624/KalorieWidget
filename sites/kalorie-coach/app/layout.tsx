import type { Metadata } from "next";
import "./globals.css";
import Install from "./install";

export const metadata: Metadata = {
  title: "Kalorie Coach",
  description: "Dein privates Tagebuch für Kalorien, Makros und schnelle Lieblingsmahlzeiten.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Kalorie Coach", statusBarStyle: "black-translucent" },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="antialiased"><Install />{children}</body>
    </html>
  );
}
