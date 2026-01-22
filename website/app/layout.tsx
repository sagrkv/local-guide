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
    default: "Summer Studios | Web Development Agency",
    template: "%s | Summer Studios",
  },
  description:
    "We're a web development studio in South India building fast, beautiful sites for startups and growing businesses. No templates. No bloat. Just clean code that converts.",
  keywords: [
    "web development",
    "web design",
    "startup website",
    "web agency",
    "Bangalore",
    "Hyderabad",
    "Chennai",
    "South India",
    "Next.js",
    "React",
  ],
  authors: [{ name: "Summer Studios" }],
  creator: "Summer Studios",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://summerstudios.in",
    siteName: "Summer Studios",
    title: "Summer Studios | Web Development Agency",
    description:
      "We're a web development studio in South India building fast, beautiful sites for startups and growing businesses.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Summer Studios",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Summer Studios | Web Development Agency",
    description:
      "We're a web development studio in South India building fast, beautiful sites for startups and growing businesses.",
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
