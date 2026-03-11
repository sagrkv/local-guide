"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { GlowOrb, DotGrid } from "@/components/visuals";

const sections = [
  { id: "acceptance", title: "Acceptance of Terms" },
  { id: "description", title: "Description of Service" },
  { id: "usage", title: "Use of the Service" },
  { id: "content", title: "Content & Data" },
  { id: "open-source", title: "Open Source License" },
  { id: "third-party", title: "Third-Party Services" },
  { id: "disclaimers", title: "Disclaimers" },
  { id: "limitation", title: "Limitation of Liability" },
  { id: "changes", title: "Changes to Terms" },
  { id: "contact", title: "Contact Information" },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <section className="pt-32 pb-12 lg:pt-40 lg:pb-16 relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-30" />

        <GlowOrb
          className="top-0 right-1/4"
          color="var(--accent)"
          size="lg"
          intensity="low"
        />
        <DotGrid
          className="bottom-0 left-10 hidden lg:block"
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
              Terms of Service
            </h1>
            <p className="text-lg text-[var(--gray-400)] leading-relaxed">
              Please read these terms carefully before using Local Guide. By
              accessing or using our service, you agree to be bound by these
              terms.
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
            <section id="acceptance" className="mb-12 scroll-mt-32">
              <h2 className="text-2xl font-bold text-white mb-4">
                1. Acceptance of Terms
              </h2>
              <div className="text-[var(--gray-400)] leading-relaxed space-y-4">
                <p>
                  By accessing or using Local Guide (&quot;the Service&quot;),
                  you agree to be bound by these Terms of Service
                  (&quot;Terms&quot;). If you do not agree to these Terms, you
                  may not access or use the Service.
                </p>
                <p>
                  Local Guide is a free, open-source platform. These Terms apply
                  to all visitors and users who access the Service.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section id="description" className="mb-12 scroll-mt-32">
              <h2 className="text-2xl font-bold text-white mb-4">
                2. Description of Service
              </h2>
              <div className="text-[var(--gray-400)] leading-relaxed space-y-4">
                <p>
                  Local Guide is a curated tourist map platform that provides:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    Interactive city maps with hand-picked places of interest
                  </li>
                  <li>
                    Curated recommendations for cafes, restaurants, temples,
                    viewpoints, and other locations
                  </li>
                  <li>
                    Ready-made travel itineraries for different trip durations
                  </li>
                  <li>City-themed visual design and navigation</li>
                </ul>
                <p>
                  The Service is provided free of charge and does not require
                  account creation for browsing.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section id="usage" className="mb-12 scroll-mt-32">
              <h2 className="text-2xl font-bold text-white mb-4">
                3. Use of the Service
              </h2>
              <div className="text-[var(--gray-400)] leading-relaxed space-y-4">
                <p>You agree to use the Service responsibly. You may:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Browse city maps and curated places</li>
                  <li>Follow itineraries for personal travel</li>
                  <li>Share links to cities and places</li>
                  <li>
                    Contribute to the open-source project per the repository
                    guidelines
                  </li>
                </ul>
                <p>You agree NOT to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    Scrape or bulk-download content for commercial resale
                  </li>
                  <li>
                    Attempt to disrupt or overload the Service infrastructure
                  </li>
                  <li>
                    Misrepresent Local Guide content as your own proprietary
                    work
                  </li>
                  <li>
                    Use the Service for any illegal or unauthorized purpose
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 4 */}
            <section id="content" className="mb-12 scroll-mt-32">
              <h2 className="text-2xl font-bold text-white mb-4">
                4. Content &amp; Data
              </h2>
              <div className="text-[var(--gray-400)] leading-relaxed space-y-4">
                <h3 className="text-lg font-semibold text-white mt-6 mb-3">
                  4.1 Place Information
                </h3>
                <p>
                  Place information on Local Guide (names, locations,
                  descriptions) is curated from publicly available sources and
                  local knowledge. While we strive for accuracy, information
                  may change -- opening hours, closures, and conditions may
                  differ from what is listed.
                </p>

                <h3 className="text-lg font-semibold text-white mt-6 mb-3">
                  4.2 User Responsibility
                </h3>
                <p>
                  You are responsible for verifying information before making
                  travel decisions. Local Guide provides recommendations, not
                  guarantees. Always confirm details directly with businesses
                  or venues.
                </p>

                <h3 className="text-lg font-semibold text-white mt-6 mb-3">
                  4.3 No Endorsement
                </h3>
                <p>
                  The inclusion of a place on Local Guide does not constitute a
                  paid endorsement. No business pays for placement. All
                  recommendations are based on genuine local knowledge and
                  curation.
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section id="open-source" className="mb-12 scroll-mt-32">
              <h2 className="text-2xl font-bold text-white mb-4">
                5. Open Source License
              </h2>
              <div className="text-[var(--gray-400)] leading-relaxed space-y-4">
                <p>
                  The Local Guide source code is open source and available on{" "}
                  <a
                    href="https://github.com/sagrkv/local-guide"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--accent)] hover:underline"
                  >
                    GitHub
                  </a>
                  . The code is licensed under the terms specified in the
                  repository.
                </p>
                <p>
                  Contributors grant a license to use their contributions as
                  part of the project under the same open-source license. By
                  contributing, you confirm that you have the right to submit
                  the work.
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section id="third-party" className="mb-12 scroll-mt-32">
              <h2 className="text-2xl font-bold text-white mb-4">
                6. Third-Party Services
              </h2>
              <div className="text-[var(--gray-400)] leading-relaxed space-y-4">
                <p>
                  Local Guide uses third-party services for map rendering and
                  hosting. When you use our maps, requests may be sent to map
                  tile providers (such as Mapbox or OpenStreetMap). These
                  services have their own terms of use and privacy policies.
                </p>
                <p>
                  Links to external websites (business websites, Google Maps
                  directions) are provided for convenience. We are not
                  responsible for the content or practices of external sites.
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section id="disclaimers" className="mb-12 scroll-mt-32">
              <h2 className="text-2xl font-bold text-white mb-4">
                7. Disclaimers
              </h2>
              <div className="text-[var(--gray-400)] leading-relaxed space-y-4">
                <p>
                  THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS
                  AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR
                  IMPLIED.
                </p>
                <p>We do not guarantee:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    The accuracy, completeness, or timeliness of place
                    information
                  </li>
                  <li>
                    That businesses listed are currently open or operating
                  </li>
                  <li>
                    Uninterrupted or error-free access to the Service
                  </li>
                  <li>
                    The quality, safety, or legality of any listed business
                  </li>
                </ul>
                <p>
                  Always exercise your own judgment when traveling. Local Guide
                  is a starting point for exploration, not a substitute for
                  personal responsibility.
                </p>
              </div>
            </section>

            {/* Section 8 */}
            <section id="limitation" className="mb-12 scroll-mt-32">
              <h2 className="text-2xl font-bold text-white mb-4">
                8. Limitation of Liability
              </h2>
              <div className="text-[var(--gray-400)] leading-relaxed space-y-4">
                <p>
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, LOCAL GUIDE AND ITS
                  CONTRIBUTORS SHALL NOT BE LIABLE FOR ANY INDIRECT,
                  INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES
                  ARISING FROM YOUR USE OF THE SERVICE.
                </p>
                <p>
                  This includes, but is not limited to, damages arising from
                  reliance on place information, travel decisions made based on
                  our content, or service interruptions.
                </p>
              </div>
            </section>

            {/* Section 9 */}
            <section id="changes" className="mb-12 scroll-mt-32">
              <h2 className="text-2xl font-bold text-white mb-4">
                9. Changes to Terms
              </h2>
              <div className="text-[var(--gray-400)] leading-relaxed space-y-4">
                <p>
                  We may update these Terms from time to time. Changes will be
                  posted on this page with an updated date. Your continued use
                  of the Service after changes become effective constitutes
                  acceptance of the revised Terms.
                </p>
              </div>
            </section>

            {/* Section 10 */}
            <section id="contact" className="mb-12 scroll-mt-32">
              <h2 className="text-2xl font-bold text-white mb-4">
                10. Contact Information
              </h2>
              <div className="text-[var(--gray-400)] leading-relaxed space-y-4">
                <p>
                  If you have any questions about these Terms, please contact
                  us:
                </p>
                <ul className="list-none space-y-2">
                  <li>
                    <strong className="text-[var(--gray-300)]">Email:</strong>{" "}
                    <a
                      href="mailto:hello@localguide.in"
                      className="text-[var(--accent)] hover:underline"
                    >
                      hello@localguide.in
                    </a>
                  </li>
                  <li>
                    <strong className="text-[var(--gray-300)]">GitHub:</strong>{" "}
                    <a
                      href="https://github.com/sagrkv/local-guide/issues"
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
                    href="/privacy"
                    className="text-[var(--gray-400)] hover:text-[var(--accent)] transition-colors text-sm"
                  >
                    Privacy Policy
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
