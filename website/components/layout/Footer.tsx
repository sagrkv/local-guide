"use client";

import Link from "next/link";

const footerLinks = [
  {
    title: "Explore",
    links: [
      { href: "/", label: "Home" },
      { href: "/explore", label: "Explore Cities" },
      { href: "/about", label: "About" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
    ],
  },
  {
    title: "Open Source",
    links: [
      {
        href: "https://github.com/sagrkv/local-guide",
        label: "GitHub",
        external: true,
      },
      {
        href: "https://github.com/sagrkv/local-guide/issues",
        label: "Report Issue",
        external: true,
      },
      {
        href: "https://github.com/sagrkv/local-guide#contributing",
        label: "Contribute",
        external: true,
      },
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
                  <span className="text-[var(--background)] font-bold text-sm">LG</span>
                </div>
                <span className="text-xl font-semibold text-white">
                  Local Guide
                </span>
              </Link>
              <p className="text-[var(--gray-400)] text-sm leading-relaxed max-w-xs mb-4">
                Beautifully curated, city-themed tourist maps. Travel like a local.
              </p>
              <p className="text-[var(--accent)] text-sm font-medium mb-4">
                Free &amp; Open Source
              </p>
              <p className="text-[var(--gray-500)] text-xs">
                Built with Next.js + Fastify
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
            &copy; {new Date().getFullYear()} Local Guide. Free &amp; open source.
          </p>

          <div className="flex items-center gap-6">
            <a
              href="https://github.com/sagrkv/local-guide"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--gray-500)] hover:text-white transition-colors text-sm inline-flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
