"use client";

import Link from "next/link";

const footerLinks = [
  {
    title: "Product",
    links: [
      { href: "/#features", label: "Features" },
      { href: "/pricing", label: "Pricing" },
      { href: "/dashboard", label: "Dashboard" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
    ],
  },
];

const socialLinks = [
  { href: "https://twitter.com/bokoapp", label: "Twitter" },
  { href: "https://linkedin.com/company/bokoapp", label: "LinkedIn" },
];

export default function Footer() {
  return (
    <footer className="border-t border-[var(--gray-800)] bg-[var(--gray-900)]">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-12">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10">
            {/* Brand Column */}
            <div className="col-span-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 mb-4"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[#FF8C40] flex items-center justify-center">
                  <span className="text-[var(--background)] font-bold text-sm">B</span>
                </div>
                <span className="text-xl font-semibold text-white">
                  Boko
                </span>
              </Link>
              <p className="text-[var(--gray-400)] text-sm leading-relaxed max-w-xs mb-6">
                B2B lead generation platform for India. Find, qualify, and convert leads with map-based targeting and AI-powered sales intelligence.
              </p>
              <a
                href="mailto:hello@boko.app"
                className="text-[var(--accent)] hover:text-white transition-colors text-sm font-medium"
              >
                hello@boko.app
              </a>
            </div>

            {/* Link Columns */}
            {footerLinks.map((group) => (
              <div key={group.title}>
                <h4 className="text-white font-medium text-sm mb-4">
                  {group.title}
                </h4>
                <ul className="space-y-3">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-[var(--gray-400)] hover:text-white transition-colors text-sm"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-[var(--gray-800)] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[var(--gray-500)] text-sm">
            &copy; {new Date().getFullYear()} Boko. All rights reserved.
          </p>

          <div className="flex items-center gap-6">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--gray-500)] hover:text-white transition-colors text-sm"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
