"use client";

import Link from "next/link";

const footerLinks = [
  {
    title: "Navigate",
    links: [
      { href: "/explore", label: "Explore" },
      { href: "/blog", label: "Blog" },
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
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
                  <span className="text-[var(--background)] font-bold text-sm">PM</span>
                </div>
                <span className="text-xl font-semibold text-white">
                  Paper Maps
                </span>
              </Link>
              <p className="text-[var(--gray-400)] text-sm leading-relaxed max-w-xs mb-4">
                Paper Maps by summar studios.
              </p>
              <p className="text-[var(--accent)] text-sm font-medium mb-4">
                Free, forever. Made with care in India.
              </p>
            </div>

            {/* Link Columns */}
            {footerLinks.map((group) => (
              <div key={group.title}>
                <h4 className="text-white font-medium text-sm mb-4">
                  {group.title}
                </h4>
                <ul className="space-y-3">
                  {group.links.map((link) => {
                    const isExternal = "external" in link && link.external;
                    if (isExternal) {
                      return (
                        <li key={link.href}>
                          <a
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--gray-400)] hover:text-white transition-colors text-sm inline-flex items-center gap-1"
                          >
                            {link.label}
                            <svg
                              className="w-3 h-3 opacity-50"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                          </a>
                        </li>
                      );
                    }
                    return (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="text-[var(--gray-400)] hover:text-white transition-colors text-sm"
                        >
                          {link.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-[var(--gray-800)] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[var(--gray-500)] text-sm">
            &copy; {new Date().getFullYear()} Paper Maps by summar studios.
          </p>
        </div>
      </div>
    </footer>
  );
}
