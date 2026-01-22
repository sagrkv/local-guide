"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/work", label: "Work" },
  { href: "/labs", label: "Labs" },
  { href: "/services", label: "Services" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const socialLinks = [
  { href: "https://twitter.com/summerstudios", label: "X", icon: "𝕏" },
  { href: "https://linkedin.com/company/summerstudios", label: "LinkedIn", icon: "in" },
  { href: "https://instagram.com/summerstudios", label: "Instagram", icon: "◎" },
];

export default function Navigation() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      {/* Desktop Vertical Navigation */}
      <nav className="fixed left-0 top-0 h-screen w-[80px] bg-[var(--gray-900)] border-r border-[var(--gray-700)] z-50 hidden lg:flex flex-col items-center py-8 justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="group flex flex-col items-center gap-1"
          aria-label="Summer Studios Home"
        >
          <span className="text-2xl font-semibold tracking-tight">
            <span className="bracket">{`{`}</span>
            <span className="text-white">S</span>
            <span className="bracket">{`}`}</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="flex flex-col items-center gap-6">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative group flex items-center justify-center`}
              >
                <span
                  className={`text-xs font-medium tracking-wide uppercase transition-colors duration-300 ${
                    isActive
                      ? "text-[var(--accent)]"
                      : "text-[var(--gray-400)] group-hover:text-white"
                  }`}
                  style={{
                    writingMode: "vertical-rl",
                    textOrientation: "mixed",
                  }}
                >
                  {link.label}
                </span>
                {isActive && (
                  <motion.span
                    layoutId="activeIndicator"
                    className="absolute -left-[29px] w-[2px] h-full bg-[var(--accent)]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Social Links */}
        <div className="flex flex-col items-center gap-4">
          {socialLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--gray-400)] hover:text-white transition-colors duration-300 text-sm"
              aria-label={link.label}
            >
              {link.icon}
            </a>
          ))}
        </div>
      </nav>

      {/* Mobile Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 lg:hidden transition-all duration-300 ${
          isScrolled ? "glass" : "bg-transparent"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            <span className="bracket">{`{`}</span>
            <span className="text-white">SUMMER</span>
            <span className="bracket">{`}`}</span>
          </Link>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="relative w-8 h-8 flex items-center justify-center"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
          >
            <span className="sr-only">Toggle menu</span>
            <div className="w-6 flex flex-col items-end gap-1.5">
              <motion.span
                animate={{
                  rotate: isMobileMenuOpen ? 45 : 0,
                  y: isMobileMenuOpen ? 7 : 0,
                  width: isMobileMenuOpen ? 24 : 24,
                }}
                transition={{ duration: 0.3, ease: [0.76, 0, 0.24, 1] }}
                className="block h-[2px] bg-white origin-center"
              />
              <motion.span
                animate={{
                  opacity: isMobileMenuOpen ? 0 : 1,
                  x: isMobileMenuOpen ? 10 : 0,
                }}
                transition={{ duration: 0.2 }}
                className="block h-[2px] w-4 bg-white"
              />
              <motion.span
                animate={{
                  rotate: isMobileMenuOpen ? -45 : 0,
                  y: isMobileMenuOpen ? -7 : 0,
                  width: isMobileMenuOpen ? 24 : 16,
                }}
                transition={{ duration: 0.3, ease: [0.76, 0, 0.24, 1] }}
                className="block h-[2px] bg-white origin-center"
              />
            </div>
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-[var(--background)] lg:hidden"
          >
            <motion.nav
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center justify-center h-full gap-8"
            >
              {navLinks.map((link, index) => {
                const isActive = pathname === link.href;
                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: 0.1 + index * 0.05,
                      duration: 0.4,
                      ease: [0.25, 1, 0.5, 1],
                    }}
                  >
                    <Link
                      href={link.href}
                      className={`text-3xl font-semibold tracking-tight transition-colors ${
                        isActive
                          ? "text-[var(--accent)]"
                          : "text-white hover:text-[var(--accent)]"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                );
              })}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex gap-6 mt-8"
              >
                {socialLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--gray-400)] hover:text-white transition-colors text-lg"
                    aria-label={link.label}
                  >
                    {link.icon}
                  </a>
                ))}
              </motion.div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
