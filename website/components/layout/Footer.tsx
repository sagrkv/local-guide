"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const footerLinks = [
  {
    title: "Pages",
    links: [
      { href: "/", label: "Home" },
      { href: "/work", label: "Work" },
      { href: "/labs", label: "Labs" },
      { href: "/services", label: "Services" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/pricing", label: "Pricing" },
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
  { href: "https://twitter.com/summerstudios", label: "Twitter / X" },
  { href: "https://linkedin.com/company/summerstudios", label: "LinkedIn" },
  { href: "https://instagram.com/summerstudios", label: "Instagram" },
  { href: "https://github.com/summerstudios", label: "GitHub" },
];

export default function Footer() {
  return (
    <footer className="ml-0 lg:ml-[80px] border-t border-[var(--gray-700)] bg-[var(--gray-900)]">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        {/* Main Footer Content */}
        <div className="py-16 lg:py-20">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 lg:gap-16">
            {/* Brand Column */}
            <div className="col-span-2 md:col-span-4 lg:col-span-2">
              <Link
                href="/"
                className="inline-block text-2xl font-semibold tracking-tight mb-4"
              >
                <span className="bracket">{`{`}</span>
                <span className="text-white">SUMMER</span>
                <span className="bracket">{`}`}</span>
              </Link>
              <p className="text-[var(--gray-400)] text-sm leading-relaxed max-w-xs mb-6">
                Building the web, one project at a time. A web development
                studio based in South India.
              </p>
              <a
                href="mailto:hello@summerstudios.in"
                className="text-[var(--accent)] hover:text-white transition-colors text-sm font-medium"
              >
                hello@summerstudios.in
              </a>
            </div>

            {/* Link Columns */}
            {footerLinks.map((group) => (
              <div key={group.title}>
                <h4 className="text-[var(--gray-300)] font-medium text-sm mb-4 uppercase tracking-wider">
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
        <div className="py-6 border-t border-[var(--gray-700)] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[var(--gray-500)] text-sm">
            © {new Date().getFullYear()} Summer Studios. All rights reserved.
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

      {/* Large Brand Text */}
      <div className="overflow-hidden py-10 border-t border-[var(--gray-700)]">
        <motion.div
          initial={{ x: "0%" }}
          animate={{ x: "-50%" }}
          transition={{
            duration: 30,
            ease: "linear",
            repeat: Infinity,
          }}
          className="flex whitespace-nowrap"
        >
          {[...Array(4)].map((_, i) => (
            <span
              key={i}
              className="text-[8vw] lg:text-[6vw] font-bold text-[var(--gray-800)] tracking-tighter mx-4"
            >
              SUMMER STUDIOS •{" "}
            </span>
          ))}
        </motion.div>
      </div>
    </footer>
  );
}
