import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono, Playfair_Display } from "next/font/google";
import { themeScript } from "@/lib/theme-script";
import { MotionProvider } from "@/components/motion-provider";
import { WatchlistRail } from "@/components/watchlist-rail";
import { getProjects } from "@/lib/data";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  manifest: "/manifest.json",
  title: {
    default: "PulsarOss — FOSS Android app health dashboard",
    template: "%s | PulsarOss",
  },
  description:
    "Prioritize actively maintained FOSS Android apps. Track the ones you rely on and discover the ones worth installing — every score is built from six transparent health signals.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://pulsaross.vercel.app"
  ),
  openGraph: {
    title: "PulsarOss — FOSS Android app health dashboard",
    description:
      "Prioritize actively maintained FOSS Android apps. Track the ones you rely on and discover the ones worth installing.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "PulsarOss — FOSS Android app health dashboard",
    description:
      "Six transparent health signals. One honest score. Never install abandonware again.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const projects = getProjects().projects;

  return (
    <html
      lang="en"
      data-theme="terminal"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} ${playfairDisplay.variable} h-full antialiased scroll-smooth`}
    >
      <head>
        <meta name="theme-color" content="#0a0e13" />
        <link rel="alternate" type="application/rss+xml" href="/api/feed" title="Pulsaross RSS Feed" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col isolate">
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <div className="grid-overlay" aria-hidden="true" />
        <MotionProvider>
          {children}
          <WatchlistRail projects={projects} />
        </MotionProvider>
      </body>
    </html>
  );
}
