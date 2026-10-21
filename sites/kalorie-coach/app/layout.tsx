import type { Metadata, Viewport } from "next";
import "./globals.css";
import Install from "./install";

export const metadata: Metadata = {
  title: "Kalorie Coach",
  description: "Dein privates Tagebuch für Kalorien, Makros und schnelle Lieblingsmahlzeiten.",
  manifest: "/manifest.webmanifest?v=2",
  appleWebApp: { capable: true, title: "Kalorie Coach", statusBarStyle: "black-translucent" },
  icons: {
    icon: "/icon-v2-64.png",
    shortcut: "/icon-v2-64.png",
    apple: "/icon-v2-180.png",
  },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#0d1625", colorScheme: "dark" };

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
