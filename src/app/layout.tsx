import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import CommandPalette from "@/components/layout/command-palette";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Research Assistant - GEPA-Powered Research Platform",
  description: "Advanced AI research assistant with genetic-evolutionary prompt optimization. Manage research missions, optimize prompts, and analyze documents with intelligent agents.",
  keywords: ["AI Research Assistant", "GEPA", "Prompt Optimization", "Research Automation", "DSPy", "Machine Learning"],
  authors: [{ name: "AI Research Team" }],
  openGraph: {
    title: "AI Research Assistant",
    description: "GEPA-powered research platform with intelligent agents and prompt optimization",
    url: "https://your-domain.com",
    siteName: "AI Research Assistant",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Research Assistant",
    description: "GEPA-powered research platform with intelligent agents and prompt optimization",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <CommandPalette />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
