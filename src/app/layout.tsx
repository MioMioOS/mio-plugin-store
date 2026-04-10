import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClientLayout } from "./client-layout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "MioIsland Plugin Store",
    template: "%s | MioIsland Plugin Store",
  },
  description:
    "Discover beautiful themes, cute buddies, and ambient sounds for MioIsland — the macOS notch app for AI agent monitoring.",
  keywords: ["MioIsland", "plugins", "themes", "macOS", "notch", "AI"],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "MioIsland Plugin Store",
    description:
      "Discover beautiful themes, cute buddies, and ambient sounds for MioIsland — the macOS notch app for AI agent monitoring.",
    type: "website",
    siteName: "MioIsland Plugin Store",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
