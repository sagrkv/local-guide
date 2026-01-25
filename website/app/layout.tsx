import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Leedo | Lead Generation SaaS",
    template: "%s | Leedo",
  },
  description:
    "Powerful lead generation platform. Discover, qualify, and manage B2B leads with automated scraping, technical analysis, and sales intelligence.",
  keywords: [
    "lead generation",
    "B2B leads",
    "sales intelligence",
    "lead scraping",
    "prospect discovery",
    "website analysis",
    "business leads",
    "SaaS",
  ],
  authors: [{ name: "Leedo" }],
  creator: "Leedo",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://leedo.io",
    siteName: "Leedo",
    title: "Leedo | Lead Generation SaaS",
    description:
      "Powerful lead generation platform. Discover, qualify, and manage B2B leads with automated scraping and sales intelligence.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Leedo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Leedo | Lead Generation SaaS",
    description:
      "Powerful lead generation platform. Discover, qualify, and manage B2B leads with automated scraping and sales intelligence.",
    images: ["/og-image.png"],
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
    <html lang="en">
      <body className={`${spaceGrotesk.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
