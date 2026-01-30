"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { GlowOrb, DotGrid } from "@/components/visuals";

const sections = [
  { id: "information-collected", title: "Information We Collect" },
  { id: "how-we-use", title: "How We Use Information" },
  { id: "data-retention", title: "Data Retention" },
  { id: "third-party", title: "Third-Party Services" },
  { id: "user-rights", title: "Your Rights (GDPR)" },
  { id: "cookies", title: "Cookies" },
  { id: "security", title: "Security Measures" },
  { id: "children", title: "Children's Privacy" },
  { id: "international", title: "International Data Transfers" },
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
              Last updated: January 29, 2026
            </p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Privacy Policy
            </h1>
            <p className="text-lg text-[var(--gray-400)] leading-relaxed">
              Your privacy is important to us. This policy explains how we
              collect, use, and protect your personal information when you use
              Leedo.
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
                <h3 className="text-lg font-semibold text-white mt-6 mb-3">
                  1.1 Account Information
                </h3>
                <p>When you create an account, we collect:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Email address</li>
                  <li>Name (if provided)</li>
                  <li>Profile information from authentication providers (Clerk)</li>
                  <li>Payment information (processed securely by our payment provider)</li>
                </ul>

                <h3 className="text-lg font-semibold text-white mt-6 mb-3">
                  1.2 Usage Data
                </h3>
                <p>We automatically collect information about how you use our Service:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Search queries and filters applied</li>
                  <li>Regions and areas searched</li>
                  <li>Leads viewed and saved</li>
                  <li>Features used and actions taken</li>
                  <li>Credit transactions and history</li>
                  <li>Login timestamps and session data</li>
                </ul>

                <h3 className="text-lg font-semibold text-white mt-6 mb-3">
                  1.3 Technical Data
                </h3>
                <p>We collect technical information including:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>IP address</li>
                  <li>Browser type and version</li>
                  <li>Device type and operating system</li>
                  <li>Referring URLs and pages visited</li>
                  <li>Time zone and location (approximate)</li>
                </ul>

                <h3 className="text-lg font-semibold text-white mt-6 mb-3">
                  1.4 Lead Data
                </h3>
                <p>
                  The business lead data we collect and provide to you is sourced
                  from publicly available information. This includes business names,
                  addresses, phone numbers, websites, and other publicly listed
                  information. This data is about businesses, not individual consumers.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section id="how-we-use" className="mb-12 scroll-mt-32">
              <h2 className="text-2xl font-bold text-white mb-4">
                2. How We Use Information
              </h2>
              <div className="text-[var(--gray-400)] leading-relaxed space-y-4">
                <p>We use the information we collect to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong className="text-[var(--gray-300)]">Provide the Service:</strong>{" "}
                    Process your searches, deliver lead data, and manage your account
                  </li>
                  <li>
                    <strong className="text-[var(--gray-300)]">Process Payments:</strong>{" "}
                    Handle credit purchases and maintain transaction records
                  </li>
                  <li>
                    <strong className="text-[var(--gray-300)]">Improve the Service:</strong>{" "}
                    Analyze usage patterns to enhance features and user experience
                  </li>
                  <li>
                    <strong className="text-[var(--gray-300)]">Communicate:</strong>{" "}
                    Send service updates, security alerts, and support messages
                  </li>
                  <li>
                    <strong className="text-[var(--gray-300)]">Ensure Security:</strong>{" "}
                    Detect and prevent fraud, abuse, and security incidents
                  </li>
                  <li>
                    <strong className="text-[var(--gray-300)]">Legal Compliance:</strong>{" "}
                    Fulfill legal obligations and respond to lawful requests
                  </li>
                </ul>
                <p>
                  We do not sell your personal information to third parties. We do
                  not use your data for targeted advertising.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section id="data-retention" className="mb-12 scroll-mt-32">
              <h2 className="text-2xl font-bold text-white mb-4">
                3. Data Retention
              </h2>
              <div className="text-[var(--gray-400)] leading-relaxed space-y-4">
                <p>We retain your data for the following periods:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong className="text-[var(--gray-300)]">Account Data:</strong>{" "}
                    Retained for the duration of your account, plus 30 days after
                    account deletion to allow for recovery
                  </li>
                  <li>
                    <strong className="text-[var(--gray-300)]">Usage Data:</strong>{" "}
                    Retained for 24 months for analytics and service improvement
                  </li>
                  <li>
                    <strong className="text-[var(--gray-300)]">Transaction Records:</strong>{" "}
                    Retained for 7 years to comply with financial regulations
                  </li>
                  <li>
                    <strong className="text-[var(--gray-300)]">Audit Logs:</strong>{" "}
                    Retained for 12 months for security and compliance purposes
                  </li>
                  <li>
                    <strong className="text-[var(--gray-300)]">Saved Leads:</strong>{" "}
                    Retained until you delete them or close your account
                  </li>
                </ul>
                <p>
                  You can request deletion of your data at any time (see Your
                  Rights section below).
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section id="third-party" className="mb-12 scroll-mt-32">
              <h2 className="text-2xl font-bold text-white mb-4">
                4. Third-Party Services
              </h2>
              <div className="text-[var(--gray-400)] leading-relaxed space-y-4">
                <p>
                  We use the following third-party services to operate Leedo. Each
                  has their own privacy policy:
                </p>

                <h3 className="text-lg font-semibold text-white mt-6 mb-3">
                  Authentication
                </h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong className="text-[var(--gray-300)]">Clerk:</strong>{" "}
                    Handles user authentication and session management.{" "}
                    <a
                      href="https://clerk.com/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--accent)] hover:underline"
                    >
                      Privacy Policy
                    </a>
                  </li>
                </ul>

                <h3 className="text-lg font-semibold text-white mt-6 mb-3">
                  Data Sources
                </h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong className="text-[var(--gray-300)]">Google Places API:</strong>{" "}
                    Provides business location and information data.{" "}
                    <a
                      href="https://policies.google.com/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--accent)] hover:underline"
                    >
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <strong className="text-[var(--gray-300)]">Google Lighthouse:</strong>{" "}
                    Analyzes website performance and quality
                  </li>
                </ul>

                <h3 className="text-lg font-semibold text-white mt-6 mb-3">
                  AI Services
                </h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong className="text-[var(--gray-300)]">Perplexity AI:</strong>{" "}
                    Generates sales intelligence summaries (business data only, not
                    personal data).{" "}
                    <a
                      href="https://www.perplexity.ai/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--accent)] hover:underline"
                    >
                      Privacy Policy
                    </a>
                  </li>
                </ul>

                <h3 className="text-lg font-semibold text-white mt-6 mb-3">
                  Infrastructure
                </h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong className="text-[var(--gray-300)]">Vercel:</strong>{" "}
                    Website hosting and deployment
                  </li>
                  <li>
                    <strong className="text-[var(--gray-300)]">Railway:</strong>{" "}
                    Backend infrastructure and database hosting
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 5 */}
            <section id="user-rights" className="mb-12 scroll-mt-32">
              <h2 className="text-2xl font-bold text-white mb-4">
                5. Your Rights (GDPR)
              </h2>
              <div className="text-[var(--gray-400)] leading-relaxed space-y-4">
                <p>
                  If you are in the European Economic Area (EEA), you have certain
                  data protection rights under GDPR. We extend these rights to all
                  users regardless of location:
                </p>

                <h3 className="text-lg font-semibold text-white mt-6 mb-3">
                  5.1 Right to Access
                </h3>
                <p>
                  You have the right to request a copy of your personal data. You
                  can export your data at any time through your account settings or
                  by contacting us.
                </p>

                <h3 className="text-lg font-semibold text-white mt-6 mb-3">
                  5.2 Right to Rectification
                </h3>
                <p>
                  You have the right to request correction of inaccurate personal
                  data. You can update most information directly in your account
                  settings.
                </p>

                <h3 className="text-lg font-semibold text-white mt-6 mb-3">
                  5.3 Right to Erasure
                </h3>
                <p>
                  You have the right to request deletion of your personal data. You
                  can delete your account through settings or by contacting us. We
                  will delete your data within 30 days, except where retention is
                  required by law.
                </p>

                <h3 className="text-lg font-semibold text-white mt-6 mb-3">
                  5.4 Right to Data Portability
                </h3>
                <p>
                  You have the right to receive your data in a structured,
                  commonly-used, machine-readable format. We provide data exports
                  in JSON and CSV formats.
                </p>

                <h3 className="text-lg font-semibold text-white mt-6 mb-3">
                  5.5 Right to Object
                </h3>
                <p>
                  You have the right to object to processing of your personal data
                  for certain purposes. Contact us to exercise this right.
                </p>

                <h3 className="text-lg font-semibold text-white mt-6 mb-3">
                  5.6 Right to Restrict Processing
                </h3>
                <p>
                  You have the right to request restriction of processing in certain
                  circumstances. Contact us to exercise this right.
                </p>

                <div className="bg-[var(--gray-900)] border border-[var(--gray-800)] rounded-lg p-4 mt-6">
                  <p className="text-[var(--gray-300)] text-sm">
                    <strong>How to Exercise Your Rights:</strong> You can exercise
                    most of these rights directly through your account settings.
                    For assistance, email{" "}
                    <a
                      href="mailto:privacy@leedo.io"
                      className="text-[var(--accent)] hover:underline"
                    >
                      privacy@leedo.io
                    </a>
                    . We will respond within 30 days.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 6 */}
            <section id="cookies" className="mb-12 scroll-mt-32">
              <h2 className="text-2xl font-bold text-white mb-4">6. Cookies</h2>
              <div className="text-[var(--gray-400)] leading-relaxed space-y-4">
                <p>We use cookies and similar technologies for:</p>

                <h3 className="text-lg font-semibold text-white mt-6 mb-3">
                  Essential Cookies
                </h3>
                <p>
                  Required for the Service to function. These include authentication
                  tokens and session identifiers. Cannot be disabled.
                </p>

                <h3 className="text-lg font-semibold text-white mt-6 mb-3">
                  Functional Cookies
                </h3>
                <p>
                  Remember your preferences and settings to improve your experience.
                </p>

                <h3 className="text-lg font-semibold text-white mt-6 mb-3">
                  Analytics Cookies
                </h3>
                <p>
                  Help us understand how users interact with the Service. We use
                  privacy-focused analytics that do not track individuals across
                  sites.
                </p>

                <p className="mt-6">
                  You can control cookies through your browser settings. Note that
                  disabling essential cookies will prevent you from using the
                  Service.
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section id="security" className="mb-12 scroll-mt-32">
              <h2 className="text-2xl font-bold text-white mb-4">
                7. Security Measures
              </h2>
              <div className="text-[var(--gray-400)] leading-relaxed space-y-4">
                <p>
                  We implement industry-standard security measures to protect your
                  data:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong className="text-[var(--gray-300)]">Encryption:</strong>{" "}
                    All data is encrypted in transit (TLS 1.3) and at rest (AES-256)
                  </li>
                  <li>
                    <strong className="text-[var(--gray-300)]">Authentication:</strong>{" "}
                    Secure authentication with optional two-factor authentication
                    (2FA)
                  </li>
                  <li>
                    <strong className="text-[var(--gray-300)]">Access Controls:</strong>{" "}
                    Role-based access controls and principle of least privilege
                  </li>
                  <li>
                    <strong className="text-[var(--gray-300)]">Monitoring:</strong>{" "}
                    Continuous security monitoring and audit logging
                  </li>
                  <li>
                    <strong className="text-[var(--gray-300)]">Regular Updates:</strong>{" "}
                    Systems are regularly updated and patched
                  </li>
                </ul>
                <p>
                  While we strive to protect your information, no method of
                  transmission over the Internet is 100% secure. If you believe your
                  account has been compromised, contact us immediately.
                </p>
              </div>
            </section>

            {/* Section 8 */}
            <section id="children" className="mb-12 scroll-mt-32">
              <h2 className="text-2xl font-bold text-white mb-4">
                8. Children&apos;s Privacy
              </h2>
              <div className="text-[var(--gray-400)] leading-relaxed space-y-4">
                <p>
                  The Service is intended for business use and is not directed at
                  individuals under 18 years of age. We do not knowingly collect
                  personal information from children under 18. If you are a parent
                  or guardian and believe your child has provided us with personal
                  information, please contact us to request deletion.
                </p>
              </div>
            </section>

            {/* Section 9 */}
            <section id="international" className="mb-12 scroll-mt-32">
              <h2 className="text-2xl font-bold text-white mb-4">
                9. International Data Transfers
              </h2>
              <div className="text-[var(--gray-400)] leading-relaxed space-y-4">
                <p>
                  Your information may be transferred to and processed in countries
                  other than your country of residence. These countries may have
                  different data protection laws.
                </p>
                <p>
                  When we transfer data internationally, we ensure appropriate
                  safeguards are in place, including:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Standard Contractual Clauses approved by the European Commission</li>
                  <li>Processing in jurisdictions with adequate data protection laws</li>
                  <li>Contractual obligations with service providers</li>
                </ul>
              </div>
            </section>

            {/* Section 10 */}
            <section id="changes" className="mb-12 scroll-mt-32">
              <h2 className="text-2xl font-bold text-white mb-4">
                10. Changes to This Policy
              </h2>
              <div className="text-[var(--gray-400)] leading-relaxed space-y-4">
                <p>
                  We may update this Privacy Policy from time to time. We will
                  notify you of changes by:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Posting the updated policy on this page</li>
                  <li>Updating the &quot;Last updated&quot; date at the top</li>
                  <li>
                    Sending an email notification for material changes that affect
                    your rights
                  </li>
                </ul>
                <p>
                  We encourage you to review this Privacy Policy periodically.
                  Continued use of the Service after changes become effective
                  constitutes acceptance of the updated policy.
                </p>
              </div>
            </section>

            {/* Section 11 */}
            <section id="contact" className="mb-12 scroll-mt-32">
              <h2 className="text-2xl font-bold text-white mb-4">
                11. Contact Us
              </h2>
              <div className="text-[var(--gray-400)] leading-relaxed space-y-4">
                <p>
                  If you have questions about this Privacy Policy or wish to
                  exercise your data protection rights, please contact us:
                </p>
                <ul className="list-none space-y-2">
                  <li>
                    <strong className="text-[var(--gray-300)]">Privacy Inquiries:</strong>{" "}
                    <a
                      href="mailto:privacy@leedo.io"
                      className="text-[var(--accent)] hover:underline"
                    >
                      privacy@leedo.io
                    </a>
                  </li>
                  <li>
                    <strong className="text-[var(--gray-300)]">General Support:</strong>{" "}
                    <a
                      href="mailto:hello@leedo.io"
                      className="text-[var(--accent)] hover:underline"
                    >
                      hello@leedo.io
                    </a>
                  </li>
                  <li>
                    <strong className="text-[var(--gray-300)]">Contact Page:</strong>{" "}
                    <Link
                      href="/contact"
                      className="text-[var(--accent)] hover:underline"
                    >
                      leedo.io/contact
                    </Link>
                  </li>
                </ul>
                <p className="mt-4">
                  For EU residents: If you are not satisfied with our response, you
                  have the right to lodge a complaint with your local data
                  protection authority.
                </p>
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
