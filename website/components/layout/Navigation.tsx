"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Navigation() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
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
      {/* Desktop Horizontal Navigation */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--gray-800)]"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12">
          <nav className="flex items-center justify-between h-[72px]">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 group"
              aria-label="Leedo Home"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[#FF8C40] flex items-center justify-center">
                <span className="text-[var(--background)] font-bold text-sm">L</span>
              </div>
              <span className="text-xl font-semibold text-white">
                Leedo
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-sm font-medium transition-colors ${
                      isActive
                        ? "text-white"
                        : "text-[var(--gray-400)] hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center gap-4">
              <Link
                href="/sign-in"
                className="text-sm font-medium text-[var(--gray-300)] hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="text-sm font-semibold px-4 py-2 rounded-lg bg-[var(--accent)] text-[var(--background)] hover:bg-[#FF8C40] transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden relative w-8 h-8 flex items-center justify-center"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">Toggle menu</span>
              <div className="w-6 flex flex-col items-end gap-1.5">
                <motion.span
                  animate={{
                    rotate: isMobileMenuOpen ? 45 : 0,
                    y: isMobileMenuOpen ? 7 : 0,
                    width: 24,
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
          </nav>
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
            className="fixed inset-0 z-40 bg-[var(--background)] lg:hidden pt-[72px]"
          >
            <motion.nav
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col px-6 py-8"
            >
              {navLinks.map((link, index) => {
                const isActive = pathname === link.href;
                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: 0.1 + index * 0.05,
                      duration: 0.4,
                      ease: [0.25, 1, 0.5, 1],
                    }}
                  >
                    <Link
                      href={link.href}
                      className={`block py-4 text-2xl font-semibold border-b border-[var(--gray-800)] ${
                        isActive
                          ? "text-[var(--accent)]"
                          : "text-white"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                );
              })}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col gap-4 mt-8"
              >
                <Link
                  href="/sign-in"
                  className="w-full text-center py-3 rounded-lg border border-[var(--gray-600)] text-white font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="w-full text-center py-3 rounded-lg bg-[var(--accent)] text-[var(--background)] font-semibold"
                >
                  Get Started
                </Link>
              </motion.div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
