import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Forge — AI Agent Platform",
  description: "Manage, deploy and monitor AI agents at scale",
  icons: { icon: "/icon.png", apple: "/apple-icon.png", shortcut: "/favicon.ico" },
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  themeColor: "#ff2b3d",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
