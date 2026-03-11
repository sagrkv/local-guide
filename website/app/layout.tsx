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
    default: "Local Guide — Curated Tourist Maps",
    template: "%s | Local Guide",
  },
  description:
    "Beautifully curated, city-themed tourist maps. Travel like a local.",
  keywords: [
    "tourist maps",
    "curated travel",
    "city guide",
    "local travel",
    "itineraries",
    "travel maps",
    "explore cities",
  ],
  authors: [{ name: "Local Guide" }],
  creator: "Local Guide",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://localguide.in",
    siteName: "Local Guide",
    title: "Local Guide — Curated Tourist Maps",
    description:
      "Beautifully curated, city-themed tourist maps. Travel like a local.",
    images: [
      {
        url: "/api/og?title=Local+Guide&subtitle=Curated+Tourist+Maps",
        width: 1200,
        height: 630,
        alt: "Local Guide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Local Guide — Curated Tourist Maps",
    description:
      "Beautifully curated, city-themed tourist maps. Travel like a local.",
    images: ["/api/og?title=Local+Guide&subtitle=Curated+Tourist+Maps"],
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
