import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://forge-sand-two.vercel.app"),
  title: "Forge — Your expertise. An Agent that delivers.",
  description: "Create personal AI Agents with your sources, evaluate them, publish versions and review real deliverables. Plans from $29 per month with shared model credit.",
  openGraph: { siteName: "Forge", type: "website", url: "/landing", title: "Forge — Your expertise. An Agent that delivers.", description: "Create personal AI Agents with your sources, evaluate them, publish versions and review real deliverables." },
  robots: { index: true, follow: true },
  icons: { icon: "/icon.png", apple: "/apple-icon.png", shortcut: "/favicon.ico" },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ff2b3d",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
