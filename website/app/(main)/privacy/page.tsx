"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { GlowOrb, DotGrid } from "@/components/visuals";

const sections = [
  { id: "information-collected", title: "Information We Collect" },
  { id: "how-we-use", title: "How We Use Information" },
  { id: "third-party", title: "Third-Party Services" },
  { id: "cookies", title: "Cookies" },
  { id: "data-retention", title: "Data Retention" },
  { id: "user-rights", title: "Your Rights" },
  { id: "children", title: "Children's Privacy" },
  { id: "changes", title: "Changes to This Policy" },
  { id: "contact", title: "Contact Us" },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <section className="pt-32 pb-12 lg:pt-40 lg:pb-16 relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-30" />

        <GlowOrb
          className="top-0 left-1/4"
          color="var(--accent)"
          size="lg"
          intensity="low"
        />
        <DotGrid
          className="bottom-0 right-10 hidden lg:block"
          rows={6}
          cols={10}
          gap={16}
          highlightPattern
        />

        <div className="max-w-[900px] mx-auto px-6 lg:px-10 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
          >
            <p className="text-[var(--gray-400)] text-sm mb-4">
              Last updated: March 10, 2026
            </p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Privacy Policy
            </h1>
            <p className="text-lg text-[var(--gray-400)] leading-relaxed">
              Paper Maps by summar studios is a free tourist map platform.
              We respect your privacy and collect minimal data. This policy
              explains what we collect and why.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Table of Contents */}
      <section className="pb-12 lg:pb-16">
        <div className="max-w-[900px] mx-auto px-6 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 1, 0.5, 1] }}
            className="bg-[var(--gray-900)] border border-[var(--gray-800)] rounded-xl p-6"
          >
            <h2 className="text-sm font-semibold text-[var(--gray-300)] uppercase tracking-wider mb-4">
              Table of Contents
            </h2>
            <nav className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {sections.map((section, index) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="text-[var(--gray-400)] hover:text-[var(--accent)] transition-colors text-sm py-1"
                >
                  {index + 1}. {section.title}
                </a>
              ))}
            </nav>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="pb-24 lg:pb-32">
        <div className="max-w-[900px] mx-auto px-6 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 1, 0.5, 1] }}
            className="prose prose-invert prose-gray max-w-none"
          >
            {/* Section 1 */}
            <section id="information-collected" className="mb-12 scroll-mt-32">
              <h2 className="text-2xl font-bold text-white mb-4">
                1. Information We Collect
              </h2>
              <div className="text-[var(--gray-400)] leading-relaxed space-y-4">
                <p>
                  Paper Maps is designed to work without requiring user
                  accounts. We collect minimal information:
                </p>

                <h3 className="text-lg font-semibold text-white mt-6 mb-3">
                  1.1 Browsing Data
                </h3>
                <p>
                  When you visit Paper Maps, we may collect basic analytics
                  data:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Pages visited and general usage patterns</li>
                  <li>Browser type and device type (aggregated)</li>
                  <li>Approximate geographic region</li>
                </ul>
                <p>
                  This data is collected in aggregate and is not linked to
                  individual users. We do not use tracking pixels or
                  fingerprinting.
                </p>

                <h3 className="text-lg font-semibold text-white mt-6 mb-3">
                  1.2 Map Data
                </h3>
                <p>
                  All city maps, curated places, and itineraries on Paper Maps
                  are publicly available. We do not collect personal data when
                  you view maps or browse places.
                </p>

                <h3 className="text-lg font-semibold text-white mt-6 mb-3">
                  1.3 What We Do Not Collect
                </h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>We do not collect personal information for browsing</li>
                  <li>We do not require account creation</li>
                  <li>We do not collect payment information (the service is free)</li>
                  <li>We do not collect location data from your device</li>
                  <li>We do not sell any data to third parties</li>
                </ul>
              </div>
            </section>

            {/* Section 2 */}
            <section id="how-we-use" className="mb-12 scroll-mt-32">
              <h2 className="text-2xl font-bold text-white mb-4">
                2. How We Use Information
              </h2>
              <div className="text-[var(--gray-400)] leading-relaxed space-y-4">
                <p>The minimal data we collect is used to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong className="text-[var(--gray-300)]">Improve the platform:</strong>{" "}
                    Understand which cities and features are most popular so we
                    can prioritize development
                  </li>
                  <li>
                    <strong className="text-[var(--gray-300)]">Fix bugs:</strong>{" "}
                    Identify and resolve technical issues
                  </li>
                  <li>
                    <strong className="text-[var(--gray-300)]">Monitor performance:</strong>{" "}
                    Ensure the site loads quickly and works reliably
                  </li>
                </ul>
                <p>
                  We do not use your data for advertising, marketing, or
                  profiling. We do not sell data to third parties.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section id="third-party" className="mb-12 scroll-mt-32">
              <h2 className="text-2xl font-bold text-white mb-4">
                3. Third-Party Services
              </h2>
              <div className="text-[var(--gray-400)] leading-relaxed space-y-4">
                <p>
                  Paper Maps uses the following third-party services:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong className="text-[var(--gray-300)]">Vercel:</strong>{" "}
                    Website hosting and deployment
                  </li>
                  <li>
                    <strong className="text-[var(--gray-300)]">Mapbox / Leaflet:</strong>{" "}
                    Interactive map rendering
                  </li>
                </ul>
                <p>
                  Each of these services has their own privacy policy. Map tile
                  requests may be logged by the map provider. We recommend
                  reviewing their respective privacy policies.
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section id="cookies" className="mb-12 scroll-mt-32">
              <h2 className="text-2xl font-bold text-white mb-4">
                4. Cookies
              </h2>
              <div className="text-[var(--gray-400)] leading-relaxed space-y-4">
                <p>
                  Paper Maps uses minimal cookies:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong className="text-[var(--gray-300)]">Essential cookies:</strong>{" "}
                    Required for basic site functionality (theme preference,
                    session management if applicable)
                  </li>
                </ul>
                <p>
                  We do not use advertising cookies, tracking cookies, or
                  third-party analytics cookies that track users across
                  websites.
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section id="data-retention" className="mb-12 scroll-mt-32">
              <h2 className="text-2xl font-bold text-white mb-4">
                5. Data Retention
              </h2>
              <div className="text-[var(--gray-400)] leading-relaxed space-y-4">
                <p>
                  Aggregated analytics data is retained for up to 12 months to
                  help us understand long-term usage trends. This data cannot
                  be used to identify individual users.
                </p>
                <p>
                  Server logs may be retained for up to 30 days for security
                  and debugging purposes.
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section id="user-rights" className="mb-12 scroll-mt-32">
              <h2 className="text-2xl font-bold text-white mb-4">
                6. Your Rights
              </h2>
              <div className="text-[var(--gray-400)] leading-relaxed space-y-4">
                <p>
                  Since we collect minimal data and do not maintain user
                  accounts, most privacy concerns are addressed by design.
                  However, you have the right to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong className="text-[var(--gray-300)]">Ask what data we hold:</strong>{" "}
                    Contact us to request information about any data associated
                    with your usage
                  </li>
                  <li>
                    <strong className="text-[var(--gray-300)]">Request deletion:</strong>{" "}
                    Request that any identifiable data be deleted
                  </li>
                  <li>
                    <strong className="text-[var(--gray-300)]">Opt out of analytics:</strong>{" "}
                    Use browser privacy settings or ad blockers to prevent
                    analytics collection
                  </li>
                </ul>
                <div className="bg-[var(--gray-900)] border border-[var(--gray-800)] rounded-lg p-4 mt-6">
                  <p className="text-[var(--gray-300)] text-sm">
                    <strong>Contact:</strong> For any privacy-related requests,
                    email{" "}
                    <a
                      href="mailto:hello@papermaps.in"
                      className="text-[var(--accent)] hover:underline"
                    >
                      hello@papermaps.in
                    </a>
                    . We will respond within 30 days.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 7 */}
            <section id="children" className="mb-12 scroll-mt-32">
              <h2 className="text-2xl font-bold text-white mb-4">
                7. Children&apos;s Privacy
              </h2>
              <div className="text-[var(--gray-400)] leading-relaxed space-y-4">
                <p>
                  Paper Maps is a general-audience website. We do not
                  knowingly collect personal information from children. Since
                  our platform does not require account creation or personal
                  data input, children can safely browse maps and itineraries.
                </p>
              </div>
            </section>

            {/* Section 8 */}
            <section id="changes" className="mb-12 scroll-mt-32">
              <h2 className="text-2xl font-bold text-white mb-4">
                8. Changes to This Policy
              </h2>
              <div className="text-[var(--gray-400)] leading-relaxed space-y-4">
                <p>
                  We may update this Privacy Policy from time to time. Changes
                  will be posted on this page with an updated date. Since we
                  do not collect email addresses, we cannot notify users of
                  changes directly. We recommend checking this page
                  periodically.
                </p>
              </div>
            </section>

            {/* Section 9 */}
            <section id="contact" className="mb-12 scroll-mt-32">
              <h2 className="text-2xl font-bold text-white mb-4">
                9. Contact Us
              </h2>
              <div className="text-[var(--gray-400)] leading-relaxed space-y-4">
                <p>
                  If you have questions about this Privacy Policy, please
                  contact us:
                </p>
                <ul className="list-none space-y-2">
                  <li>
                    <strong className="text-[var(--gray-300)]">Email:</strong>{" "}
                    <a
                      href="mailto:hello@papermaps.in"
                      className="text-[var(--accent)] hover:underline"
                    >
                      hello@papermaps.in
                    </a>
                  </li>
                  <li>
                    <strong className="text-[var(--gray-300)]">GitHub:</strong>{" "}
                    <a
                      href="https://github.com/summar-studios/paper-maps/issues"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--accent)] hover:underline"
                    >
                      Open an issue
                    </a>
                  </li>
                </ul>
              </div>
            </section>

            {/* Back to top & related links */}
            <div className="mt-16 pt-8 border-t border-[var(--gray-800)]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <a
                  href="#"
                  className="text-[var(--gray-400)] hover:text-[var(--accent)] transition-colors text-sm"
                >
                  Back to top
                </a>
                <div className="flex items-center gap-6">
                  <Link
                    href="/terms"
                    className="text-[var(--gray-400)] hover:text-[var(--accent)] transition-colors text-sm"
                  >
                    Terms of Service
                  </Link>
                  <Link
                    href="/about"
                    className="text-[var(--gray-400)] hover:text-[var(--accent)] transition-colors text-sm"
                  >
                    About
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
