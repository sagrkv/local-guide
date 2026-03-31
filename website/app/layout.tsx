import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Paper Maps — Curated City Guides",
    template: "%s | Paper Maps",
  },
  description:
    "Beautifully curated tourist maps for Indian cities. Hand-picked by locals who actually know.",
  keywords: [
    "tourist maps",
    "curated travel",
    "city guide",
    "local travel",
    "itineraries",
    "travel maps",
    "explore cities",
    "paper maps",
    "india travel",
  ],
  authors: [{ name: "Paper Maps by summar studios" }],
  creator: "summar studios",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://papermaps.in",
    siteName: "Paper Maps",
    title: "Paper Maps — Curated City Guides",
    description:
      "Beautifully curated tourist maps for Indian cities. Hand-picked by locals who actually know.",
    images: [
      {
        url: "/api/og?title=Paper+Maps&subtitle=Curated+City+Guides",
        width: 1200,
        height: 630,
        alt: "Paper Maps",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Paper Maps — Curated City Guides",
    description:
      "Beautifully curated tourist maps for Indian cities. Hand-picked by locals who actually know.",
    images: ["/api/og?title=Paper+Maps&subtitle=Curated+City+Guides"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/logos/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1E3A5F" />
      </head>
      <body className={`${spaceGrotesk.variable} antialiased`}>
        <ThemeProvider>
          {children}
          <ServiceWorkerRegistration />
        </ThemeProvider>
      </body>
    </html>
  );
}
