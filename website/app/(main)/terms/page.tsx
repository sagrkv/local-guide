"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { GlowOrb, DotGrid } from "@/components/visuals";

const sections = [
  { id: "acceptance", title: "Acceptance of Terms" },
  { id: "description", title: "Description of Service" },
  { id: "accounts", title: "User Accounts" },
  { id: "credits", title: "Credit System & Payments" },
  { id: "acceptable-use", title: "Acceptable Use" },
  { id: "data-scraping", title: "Data Scraping Disclaimer" },
  { id: "intellectual-property", title: "Intellectual Property" },
  { id: "limitation", title: "Limitation of Liability" },
  { id: "termination", title: "Termination" },
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
              Last updated: January 29, 2026
            </p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Terms of Service
            </h1>
            <p className="text-lg text-[var(--gray-400)] leading-relaxed">
              Please read these terms carefully before using Boko. By accessing
              or using our service, you agree to be bound by these terms.
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
                  By accessing or using Boko (&quot;the Service&quot;), operated by
                  Boko (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), you agree to be bound by these
                  Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms,
                  you may not access or use the Service.
                </p>
                <p>
                  These Terms apply to all visitors, users, and others who access
                  or use the Service. By using the Service, you represent that you
                  are at least 18 years old and have the legal capacity to enter
                  into these Terms.
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
                  Boko is a B2B lead generation platform that helps businesses
                  discover potential customers through:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Map-based business discovery using Google Places API</li>
                  <li>Automated data collection from publicly available sources</li>
                  <li>Lead qualification through website analysis (Lighthouse)</li>
                  <li>AI-powered sales intelligence generation</li>
                  <li>Lead management and pipeline tracking tools</li>
                </ul>
                <p>
                  The Service operates on a credit-based system where users
                  purchase credits to access lead data and analysis features.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section id="accounts" className="mb-12 scroll-mt-32">
              <h2 className="text-2xl font-bold text-white mb-4">
                3. User Accounts
              </h2>
              <div className="text-[var(--gray-400)] leading-relaxed space-y-4">
                <p>
                  To use certain features of the Service, you must create an
                  account. You are responsible for:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    Maintaining the confidentiality of your account credentials
                  </li>
                  <li>All activities that occur under your account</li>
                  <li>
                    Providing accurate, current, and complete information during
                    registration
                  </li>
                  <li>
                    Notifying us immediately of any unauthorized use of your
                    account
                  </li>
                </ul>
                <p>
                  We reserve the right to suspend or terminate accounts that
                  violate these Terms or engage in fraudulent activity.
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section id="credits" className="mb-12 scroll-mt-32">
              <h2 className="text-2xl font-bold text-white mb-4">
                4. Credit System & Payments
              </h2>
              <div className="text-[var(--gray-400)] leading-relaxed space-y-4">
                <h3 className="text-lg font-semibold text-white mt-6 mb-3">
                  4.1 Credit Usage
                </h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>1 credit = 1 valid lead that matches your search criteria</li>
                  <li>1 credit = 1 Lighthouse website analysis</li>
                  <li>1 credit = 1 tech stack detection</li>
                  <li>1 credit = 1 AI-powered sales intelligence generation</li>
                </ul>

                <h3 className="text-lg font-semibold text-white mt-6 mb-3">
                  4.2 Payment Terms
                </h3>
                <p>
                  Credits are purchased in advance. All payments are processed
                  securely through our payment provider. Prices are subject to
                  change with reasonable notice.
                </p>

                <h3 className="text-lg font-semibold text-white mt-6 mb-3">
                  4.3 Refund Policy
                </h3>
                <p>
                  Credits are non-refundable except in cases of technical failure
                  on our part that prevents service delivery. If you experience
                  issues with the Service, contact our support team within 7 days
                  to request a review. Unused credits do not expire.
                </p>

                <h3 className="text-lg font-semibold text-white mt-6 mb-3">
                  4.4 Promotional Credits
                </h3>
                <p>
                  Promotional or bonus credits may be subject to additional terms
                  and may have expiration dates. These will be clearly
                  communicated when issued.
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section id="acceptable-use" className="mb-12 scroll-mt-32">
              <h2 className="text-2xl font-bold text-white mb-4">
                5. Acceptable Use Policy
              </h2>
              <div className="text-[var(--gray-400)] leading-relaxed space-y-4">
                <p>You agree NOT to use the Service to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    Violate any applicable laws, regulations, or third-party
                    rights
                  </li>
                  <li>
                    Send unsolicited communications (spam) to leads obtained
                    through the Service
                  </li>
                  <li>
                    Harass, threaten, or harm any individual or business
                  </li>
                  <li>
                    Resell, redistribute, or commercially exploit lead data
                    without authorization
                  </li>
                  <li>
                    Attempt to circumvent credit charges or exploit system
                    vulnerabilities
                  </li>
                  <li>
                    Use automated tools to access the Service beyond normal usage
                    patterns
                  </li>
                  <li>
                    Impersonate any person or entity, or misrepresent your
                    affiliation
                  </li>
                </ul>
                <p>
                  Violation of this policy may result in immediate account
                  termination without refund.
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section id="data-scraping" className="mb-12 scroll-mt-32">
              <h2 className="text-2xl font-bold text-white mb-4">
                6. Data Scraping Disclaimer
              </h2>
              <div className="text-[var(--gray-400)] leading-relaxed space-y-4">
                <p>
                  Boko collects business information from publicly available
                  sources, including but not limited to Google Maps, Google
                  Places API, and public websites. By using our Service, you
                  acknowledge and agree that:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong className="text-[var(--gray-300)]">Data Accuracy:</strong> We
                    do not guarantee the accuracy, completeness, or timeliness of
                    any data provided. Business information may be outdated or
                    incorrect.
                  </li>
                  <li>
                    <strong className="text-[var(--gray-300)]">Third-Party Terms:</strong>{" "}
                    Data sourced from third-party APIs (such as Google) is subject
                    to their respective terms of service. You agree to comply with
                    all applicable third-party terms.
                  </li>
                  <li>
                    <strong className="text-[var(--gray-300)]">Compliance Responsibility:</strong>{" "}
                    You are solely responsible for ensuring your use of lead data
                    complies with all applicable laws, including but not limited to
                    GDPR, CAN-SPAM, and local data protection regulations.
                  </li>
                  <li>
                    <strong className="text-[var(--gray-300)]">No Endorsement:</strong> The
                    inclusion of any business in our database does not constitute
                    an endorsement or recommendation.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 7 */}
            <section id="intellectual-property" className="mb-12 scroll-mt-32">
              <h2 className="text-2xl font-bold text-white mb-4">
                7. Intellectual Property
              </h2>
              <div className="text-[var(--gray-400)] leading-relaxed space-y-4">
                <p>
                  The Service, including its original content, features,
                  functionality, and underlying technology, is owned by Boko and
                  is protected by copyright, trademark, and other intellectual
                  property laws.
                </p>
                <p>
                  You retain ownership of any data you input into the Service.
                  However, you grant us a limited license to process this data as
                  necessary to provide the Service.
                </p>
                <p>
                  Lead data obtained through the Service is licensed to you for
                  your internal business purposes only. You may not resell,
                  redistribute, or create derivative products from this data
                  without our written consent.
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
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, BOKO SHALL NOT BE
                  LIABLE FOR:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    Any indirect, incidental, special, consequential, or punitive
                    damages
                  </li>
                  <li>Loss of profits, revenue, data, or business opportunities</li>
                  <li>
                    Damages arising from your use or inability to use the Service
                  </li>
                  <li>
                    Actions taken by third parties based on data obtained through
                    the Service
                  </li>
                  <li>
                    Service interruptions, errors, or data inaccuracies
                  </li>
                </ul>
                <p>
                  Our total liability for any claims arising from or related to
                  the Service shall not exceed the amount you paid to us in the
                  twelve (12) months preceding the claim.
                </p>
                <p>
                  THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT
                  WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
                </p>
              </div>
            </section>

            {/* Section 9 */}
            <section id="termination" className="mb-12 scroll-mt-32">
              <h2 className="text-2xl font-bold text-white mb-4">
                9. Termination
              </h2>
              <div className="text-[var(--gray-400)] leading-relaxed space-y-4">
                <p>
                  We may terminate or suspend your account and access to the
                  Service immediately, without prior notice, for any reason,
                  including:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Violation of these Terms</li>
                  <li>Fraudulent or illegal activity</li>
                  <li>Non-payment of fees</li>
                  <li>At our sole discretion for any other reason</li>
                </ul>
                <p>
                  You may terminate your account at any time by contacting our
                  support team. Upon termination, your right to use the Service
                  will cease immediately. Unused credits are non-refundable upon
                  voluntary termination.
                </p>
                <p>
                  Sections of these Terms that by their nature should survive
                  termination shall survive, including intellectual property
                  provisions, disclaimers, and limitations of liability.
                </p>
              </div>
            </section>

            {/* Section 10 */}
            <section id="changes" className="mb-12 scroll-mt-32">
              <h2 className="text-2xl font-bold text-white mb-4">
                10. Changes to Terms
              </h2>
              <div className="text-[var(--gray-400)] leading-relaxed space-y-4">
                <p>
                  We reserve the right to modify these Terms at any time. We will
                  notify users of significant changes by:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Posting the updated Terms on this page</li>
                  <li>Updating the &quot;Last updated&quot; date</li>
                  <li>
                    Sending an email notification for material changes (where
                    applicable)
                  </li>
                </ul>
                <p>
                  Your continued use of the Service after changes become effective
                  constitutes acceptance of the revised Terms. If you do not agree
                  to the new Terms, you must stop using the Service.
                </p>
              </div>
            </section>

            {/* Section 11 */}
            <section id="contact" className="mb-12 scroll-mt-32">
              <h2 className="text-2xl font-bold text-white mb-4">
                11. Contact Information
              </h2>
              <div className="text-[var(--gray-400)] leading-relaxed space-y-4">
                <p>
                  If you have any questions about these Terms, please contact us:
                </p>
                <ul className="list-none space-y-2">
                  <li>
                    <strong className="text-[var(--gray-300)]">Email:</strong>{" "}
                    <a
                      href="mailto:hello@boko.app"
                      className="text-[var(--accent)] hover:underline"
                    >
                      hello@boko.app
                    </a>
                  </li>
                  <li>
                    <strong className="text-[var(--gray-300)]">Support:</strong>{" "}
                    <a
                      href="mailto:hello@boko.app"
                      className="text-[var(--accent)] hover:underline"
                    >
                      hello@boko.app
                    </a>
                  </li>
                  <li>
                    <strong className="text-[var(--gray-300)]">Contact Page:</strong>{" "}
                    <Link
                      href="/contact"
                      className="text-[var(--accent)] hover:underline"
                    >
                      boko.app/contact
                    </Link>
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
                    href="/contact"
                    className="text-[var(--gray-400)] hover:text-[var(--accent)] transition-colors text-sm"
                  >
                    Contact Us
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
