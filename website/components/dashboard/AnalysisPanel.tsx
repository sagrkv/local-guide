"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

// ============================================================================
// Types
// ============================================================================

interface TechStack {
  cms?: string;
  framework?: string;
  hosting?: string;
  ecommerce?: string;
  analytics?: string[];
  marketing?: string[];
  security?: {
    hasSSL: boolean;
    sslIssuer?: string;
  };
  mobile?: {
    isResponsive: boolean;
    hasMobileApp?: boolean;
  };
  performance?: {
    estimatedLoadTime?: string;
    issues?: string[];
  };
  seoTools?: string[];
  socialIntegrations?: string[];
  paymentGateways?: string[];
  chatbots?: string[];
  otherTechnologies?: string[];
  recommendations?: string[];
}

interface SalesIntelligence {
  decisionMakers?: Array<{
    name: string;
    title?: string;
    email?: string;
    linkedin?: string;
  }>;
  companySize?: string;
  estimatedRevenue?: string;
  foundedYear?: number;
  industry?: string;
  specializations?: string[];
  painPoints?: string[];
  webServiceNeeds?: string[];
  recentNews?: string[];
  competitorWebsites?: string[];
  personalizedPitch?: string;
  researchedAt?: string;
  overview?: string;
  outreachAngle?: string;
  talkingPoints?: string[];
  techStack?: TechStack;
}

interface Lead {
  id: string;
  businessName: string;
  website: string | null;
  hasWebsite: boolean;
  lighthouseScore: number | null;
  lighthouseSeo: number | null;
  lighthouseAccessibility: number | null;
  lighthouseBestPractices: number | null;
  websiteNeedsRedesign: boolean;
  qualificationError: string | null;
  salesIntelligence: SalesIntelligence | null;
}

interface AnalysisPanelProps {
  lead: Lead;
  onAnalysisComplete: () => void;
}

// ============================================================================
// Credit Costs
// ============================================================================

const CREDIT_COSTS = {
  lighthouse: 1,
  techStack: 1,
  salesIntel: 1,
} as const;

// ============================================================================
// Main Component
// ============================================================================

export default function AnalysisPanel({ lead, onAnalysisComplete }: AnalysisPanelProps) {
  const [lighthouseLoading, setLighthouseLoading] = useState(false);
  const [techStackLoading, setTechStackLoading] = useState(false);
  const [salesIntelLoading, setSalesIntelLoading] = useState(false);
  const [techStack, setTechStack] = useState<TechStack | null>(
    lead.salesIntelligence?.techStack as TechStack | null ?? null
  );
  const [confirmModal, setConfirmModal] = useState<{
    type: "lighthouse" | "techStack" | "salesIntel";
    cost: number;
  } | null>(null);

  // Lighthouse Analysis
  const handleLighthouse = useCallback(async () => {
    setConfirmModal(null);
    setLighthouseLoading(true);
    try {
      const result = await apiClient.rerunLighthouse(lead.id);

      if (result.domainStatus === "expired") {
        toast.error(`Domain expired: ${result.statusMessage || "Domain no longer exists"}`);
        return;
      }
      if (result.domainStatus === "parked") {
        toast.error(`Domain parked: ${result.statusMessage || "Domain is parked/for sale"}`);
        return;
      }
      if (result.redirected && result.finalUrl) {
        toast.info(`Website redirected to: ${result.finalUrl}`, { duration: 5000 });
      }

      const score = result.results?.performance ?? "N/A";
      toast.success(`Lighthouse complete: Performance ${score}/100`);
      onAnalysisComplete();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Analysis failed";
      toast.error(`Lighthouse failed: ${message}`);
    } finally {
      setLighthouseLoading(false);
    }
  }, [lead.id, onAnalysisComplete]);

  // Tech Stack Detection
  const handleTechStack = useCallback(async () => {
    setConfirmModal(null);
    setTechStackLoading(true);
    try {
      const result = await apiClient.detectTechStack(lead.id);
      if (result && Object.keys(result).length > 0) {
        setTechStack(result);
        toast.success("Tech stack detected");
        onAnalysisComplete();
      } else {
        toast.error("Could not detect tech stack - website may be inaccessible");
      }
    } catch {
      toast.error("Failed to detect tech stack");
    } finally {
      setTechStackLoading(false);
    }
  }, [lead.id, onAnalysisComplete]);

  // Sales Intelligence
  const handleSalesIntel = useCallback(async () => {
    setConfirmModal(null);
    setSalesIntelLoading(true);
    try {
      await apiClient.deepResearchProspect(lead.id);
      toast.success("Sales intelligence generated");
      onAnalysisComplete();
    } catch {
      toast.error("Failed to generate sales intelligence");
    } finally {
      setSalesIntelLoading(false);
    }
  }, [lead.id, onAnalysisComplete]);

  const confirmAction = (type: "lighthouse" | "techStack" | "salesIntel") => {
    setConfirmModal({ type, cost: CREDIT_COSTS[type] });
  };

  const executeConfirmedAction = () => {
    if (!confirmModal) return;
    switch (confirmModal.type) {
      case "lighthouse":
        handleLighthouse();
        break;
      case "techStack":
        handleTechStack();
        break;
      case "salesIntel":
        handleSalesIntel();
        break;
    }
  };

  if (!lead.hasWebsite) {
    return (
      <div className="analysis-panel-container">
        <NoWebsiteState businessName={lead.businessName} />
      </div>
    );
  }

  return (
    <div className="analysis-panel-container">
      <style jsx global>{`
        .analysis-panel-container {
          --panel-bg: rgba(10, 10, 11, 0.8);
          --panel-border: rgba(255, 255, 255, 0.06);
          --panel-glow: rgba(255, 107, 0, 0.1);
          --score-green: #00D68F;
          --score-yellow: #FFB800;
          --score-orange: #FF8C40;
          --score-red: #FF4757;
        }

        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }

        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 1; }
          100% { transform: scale(1.1); opacity: 0; }
        }

        @keyframes data-stream {
          0% { background-position: 0% 0%; }
          100% { background-position: 100% 100%; }
        }

        @keyframes gauge-fill {
          from { stroke-dashoffset: 283; }
        }

        .scan-effect {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          border-radius: inherit;
        }

        .scan-effect::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            transparent 0%,
            rgba(255, 107, 0, 0.03) 50%,
            transparent 100%
          );
          animation: scanline 3s linear infinite;
        }

        .tech-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 8px;
        }

        .tech-chip {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01));
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 500;
          color: var(--gray-200);
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }

        .tech-chip::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, transparent, rgba(255, 107, 0, 0.1));
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .tech-chip:hover::before {
          opacity: 1;
        }

        .tech-chip:hover {
          border-color: rgba(255, 107, 0, 0.3);
          transform: translateY(-1px);
        }

        .intel-card {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.02), transparent);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          padding: 16px;
          position: relative;
        }

        .intel-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 16px;
          right: 16px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 107, 0, 0.3), transparent);
        }

        .decision-maker-card {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 14px;
          transition: all 0.2s ease;
        }

        .decision-maker-card:hover {
          border-color: rgba(255, 107, 0, 0.2);
          background: rgba(255, 107, 0, 0.02);
        }

        .credit-burn-animation {
          position: relative;
        }

        .credit-burn-animation::after {
          content: '';
          position: absolute;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--accent);
          animation: pulse-ring 1s ease-out infinite;
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)]/20 to-transparent flex items-center justify-center">
            <AnalysisIcon className="w-5 h-5 text-[var(--accent)]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Website Analysis</h2>
            <p className="text-xs text-gray-500">Deep insights for {lead.businessName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <SignalIcon className="w-4 h-4" />
          <span>{lead.website}</span>
        </div>
      </div>

      {/* Three Analysis Sections */}
      <div className="space-y-6">
        {/* 1. Lighthouse Performance */}
        <LighthouseSection
          lead={lead}
          loading={lighthouseLoading}
          onAnalyze={() => confirmAction("lighthouse")}
        />

        {/* 2. Tech Stack */}
        <TechStackSection
          techStack={techStack}
          loading={techStackLoading}
          onAnalyze={() => confirmAction("techStack")}
        />

        {/* 3. Sales Intelligence */}
        <SalesIntelSection
          salesIntel={lead.salesIntelligence}
          loading={salesIntelLoading}
          onAnalyze={() => confirmAction("salesIntel")}
        />
      </div>

      {/* Cost Confirmation Modal */}
      <AnimatePresence>
        {confirmModal && (
          <CostConfirmationModal
            type={confirmModal.type}
            cost={confirmModal.cost}
            onConfirm={executeConfirmedAction}
            onCancel={() => setConfirmModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Lighthouse Section
// ============================================================================

function LighthouseSection({
  lead,
  loading,
  onAnalyze,
}: {
  lead: Lead;
  loading: boolean;
  onAnalyze: () => void;
}) {
  const hasScores = lead.lighthouseScore !== null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
      className="relative bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-2xl overflow-hidden"
    >
      <div className="scan-effect" />

      {/* Section Header */}
      <div className="flex items-center justify-between p-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
            <LighthouseIcon className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Performance Audit</h3>
            <p className="text-[11px] text-gray-500">Lighthouse analysis</p>
          </div>
        </div>
        <AnalyzeButton
          onClick={onAnalyze}
          loading={loading}
          hasData={hasScores}
          cost={CREDIT_COSTS.lighthouse}
        />
      </div>

      {/* Content */}
      <div className="p-5">
        {lead.qualificationError ? (
          <ErrorState message={lead.qualificationError} />
        ) : hasScores ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <ScoreGauge label="Performance" score={lead.lighthouseScore!} />
            <ScoreGauge label="SEO" score={lead.lighthouseSeo ?? 0} />
            <ScoreGauge label="Accessibility" score={lead.lighthouseAccessibility ?? 0} />
            <ScoreGauge label="Best Practices" score={lead.lighthouseBestPractices ?? 0} />
          </div>
        ) : (
          <EmptyAnalysisState
            icon={<LighthouseIcon className="w-8 h-8" />}
            message="Run Lighthouse audit to analyze website performance"
          />
        )}

        {hasScores && lead.websiteNeedsRedesign && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <AlertIcon className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-red-400">Website needs improvement</p>
              <p className="text-xs text-red-400/70">Low scores indicate opportunity for web services</p>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// Tech Stack Section
// ============================================================================

function TechStackSection({
  techStack,
  loading,
  onAnalyze,
}: {
  techStack: TechStack | null;
  loading: boolean;
  onAnalyze: () => void;
}) {
  const hasTechStack = Boolean(techStack && Object.keys(techStack).length > 0);

  // Collect all technologies into a flat array for display
  const allTechs: Array<{ name: string; category: string; color: string }> = [];

  if (techStack) {
    if (techStack.cms) allTechs.push({ name: techStack.cms, category: "CMS", color: "purple" });
    if (techStack.framework) allTechs.push({ name: techStack.framework, category: "Framework", color: "blue" });
    if (techStack.hosting) allTechs.push({ name: techStack.hosting, category: "Hosting", color: "green" });
    if (techStack.ecommerce) allTechs.push({ name: techStack.ecommerce, category: "E-commerce", color: "orange" });
    techStack.analytics?.forEach(t => allTechs.push({ name: t, category: "Analytics", color: "cyan" }));
    techStack.marketing?.forEach(t => allTechs.push({ name: t, category: "Marketing", color: "pink" }));
    techStack.chatbots?.forEach(t => allTechs.push({ name: t, category: "Chatbot", color: "yellow" }));
    techStack.paymentGateways?.forEach(t => allTechs.push({ name: t, category: "Payment", color: "emerald" }));
    techStack.otherTechnologies?.forEach(t => allTechs.push({ name: t, category: "Other", color: "gray" }));
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 1, 0.5, 1] }}
      className="relative bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-2xl overflow-hidden"
    >
      <div className="scan-effect" />

      {/* Section Header */}
      <div className="flex items-center justify-between p-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <StackIcon className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Technology Stack</h3>
            <p className="text-[11px] text-gray-500">Detected frameworks & tools</p>
          </div>
        </div>
        <AnalyzeButton
          onClick={onAnalyze}
          loading={loading}
          hasData={hasTechStack}
          cost={CREDIT_COSTS.techStack}
        />
      </div>

      {/* Content */}
      <div className="p-5">
        {hasTechStack ? (
          <div className="space-y-4">
            {/* Status Badges */}
            <div className="flex flex-wrap gap-2">
              {techStack?.security && (
                <StatusBadge
                  positive={techStack.security.hasSSL}
                  label={techStack.security.hasSSL ? "SSL Secured" : "No SSL"}
                />
              )}
              {techStack?.mobile && (
                <StatusBadge
                  positive={techStack.mobile.isResponsive}
                  label={techStack.mobile.isResponsive ? "Responsive" : "Not Responsive"}
                />
              )}
              {techStack?.performance?.estimatedLoadTime && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-gray-800 text-gray-400 border border-gray-700">
                  <ClockIcon className="w-3 h-3" />
                  {techStack.performance.estimatedLoadTime}
                </span>
              )}
            </div>

            {/* Tech Grid */}
            <div className="tech-grid">
              {allTechs.map((tech, idx) => (
                <motion.div
                  key={`${tech.name}-${idx}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  className="tech-chip"
                >
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-0.5">
                    {tech.category}
                  </span>
                  <span className="text-gray-200">{tech.name}</span>
                </motion.div>
              ))}
            </div>

            {/* Issues */}
            {techStack?.performance?.issues && techStack.performance.issues.length > 0 && (
              <div className="mt-4 p-3 bg-orange-500/5 border border-orange-500/20 rounded-lg">
                <p className="text-[11px] text-orange-400 font-semibold uppercase tracking-wider mb-2">
                  Issues Detected
                </p>
                <ul className="space-y-1">
                  {techStack.performance.issues.map((issue, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-orange-300/80">
                      <WarningIcon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {techStack?.recommendations && techStack.recommendations.length > 0 && (
              <div className="mt-4 p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-lg">
                <p className="text-[11px] text-cyan-400 font-semibold uppercase tracking-wider mb-2">
                  Recommendations
                </p>
                <ul className="space-y-1">
                  {techStack.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-gray-400">
                      <ArrowRightIcon className="w-3 h-3 mt-0.5 text-cyan-400 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <EmptyAnalysisState
            icon={<StackIcon className="w-8 h-8" />}
            message="Scan website to detect technologies and frameworks"
          />
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// Sales Intelligence Section
// ============================================================================

function SalesIntelSection({
  salesIntel,
  loading,
  onAnalyze,
}: {
  salesIntel: SalesIntelligence | null;
  loading: boolean;
  onAnalyze: () => void;
}) {
  const hasIntel = Boolean(salesIntel && Object.keys(salesIntel).length > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 1, 0.5, 1] }}
      className="relative bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-2xl overflow-hidden"
    >
      <div className="scan-effect" />

      {/* Section Header */}
      <div className="flex items-center justify-between p-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <SparklesIcon className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Sales Intelligence</h3>
            <p className="text-[11px] text-gray-500">
              AI-powered research
              {salesIntel?.researchedAt && (
                <span className="ml-2 text-gray-600">
                  Updated {new Date(salesIntel.researchedAt).toLocaleDateString()}
                </span>
              )}
            </p>
          </div>
        </div>
        <AnalyzeButton
          onClick={onAnalyze}
          loading={loading}
          hasData={hasIntel}
          cost={CREDIT_COSTS.salesIntel}
          label={hasIntel ? "Refresh" : "Generate"}
        />
      </div>

      {/* Content */}
      <div className="p-5">
        {hasIntel ? (
          <div className="space-y-5">
            {/* Overview */}
            {salesIntel?.overview && (
              <div className="intel-card">
                <p className="text-sm text-gray-300 leading-relaxed">{salesIntel.overview}</p>
              </div>
            )}

            {/* Company Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {salesIntel?.companySize && (
                <StatCard label="Company Size" value={salesIntel.companySize} icon={<UsersIcon className="w-4 h-4" />} />
              )}
              {salesIntel?.estimatedRevenue && (
                <StatCard label="Est. Revenue" value={salesIntel.estimatedRevenue} icon={<DollarIcon className="w-4 h-4" />} />
              )}
              {salesIntel?.foundedYear && (
                <StatCard label="Founded" value={String(salesIntel.foundedYear)} icon={<CalendarIcon className="w-4 h-4" />} />
              )}
              {salesIntel?.industry && (
                <StatCard label="Industry" value={salesIntel.industry} icon={<BuildingIcon className="w-4 h-4" />} />
              )}
            </div>

            {/* Decision Makers */}
            {salesIntel?.decisionMakers && salesIntel.decisionMakers.length > 0 && (
              <div>
                <SectionLabel icon={<UserCircleIcon className="w-4 h-4" />} label="Decision Makers" />
                <div className="grid gap-2 mt-2">
                  {salesIntel.decisionMakers.map((dm, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="decision-maker-card flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-sm font-semibold text-purple-300">
                          {dm.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{dm.name}</p>
                          {dm.title && <p className="text-xs text-gray-500">{dm.title}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {dm.email && (
                          <a
                            href={`mailto:${dm.email}`}
                            className="p-2 rounded-lg bg-white/5 hover:bg-[var(--accent)]/10 text-gray-400 hover:text-[var(--accent)] transition-colors"
                          >
                            <EmailIcon className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {dm.linkedin && (
                          <a
                            href={dm.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-white/5 hover:bg-blue-500/10 text-gray-400 hover:text-blue-400 transition-colors"
                          >
                            <LinkedInIcon className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Pain Points & Service Needs */}
            <div className="grid md:grid-cols-2 gap-4">
              {salesIntel?.painPoints && salesIntel.painPoints.length > 0 && (
                <div className="intel-card">
                  <SectionLabel icon={<TargetIcon className="w-4 h-4" />} label="Pain Points" color="red" />
                  <ul className="mt-2 space-y-1.5">
                    {salesIntel.painPoints.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-gray-400">
                        <span className="text-red-400 mt-0.5">*</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {salesIntel?.webServiceNeeds && salesIntel.webServiceNeeds.length > 0 && (
                <div className="intel-card">
                  <SectionLabel icon={<BriefcaseIcon className="w-4 h-4" />} label="Service Opportunities" color="green" />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {salesIntel.webServiceNeeds.map((need, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-green-500/10 text-green-400 text-xs rounded-md border border-green-500/20"
                      >
                        {need}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Talking Points */}
            {salesIntel?.talkingPoints && salesIntel.talkingPoints.length > 0 && (
              <div className="intel-card">
                <SectionLabel icon={<ChatIcon className="w-4 h-4" />} label="Talking Points" color="blue" />
                <ul className="mt-2 space-y-1.5">
                  {salesIntel.talkingPoints.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-gray-400">
                      <ArrowRightIcon className="w-3 h-3 mt-0.5 text-blue-400 flex-shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Personalized Pitch */}
            {salesIntel?.personalizedPitch && (
              <div className="p-4 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/5 border border-purple-500/20 rounded-xl">
                <p className="text-[11px] text-purple-400 font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
                  <SparklesIcon className="w-3.5 h-3.5" />
                  Suggested Pitch
                </p>
                <p className="text-sm text-gray-300 leading-relaxed">{salesIntel.personalizedPitch}</p>
              </div>
            )}

            {/* Outreach Angle */}
            {salesIntel?.outreachAngle && (
              <div className="p-4 bg-gradient-to-br from-[var(--accent)]/10 via-transparent to-orange-500/5 border border-[var(--accent)]/20 rounded-xl">
                <p className="text-[11px] text-[var(--accent)] font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
                  <TargetIcon className="w-3.5 h-3.5" />
                  Outreach Angle
                </p>
                <p className="text-sm text-gray-300 leading-relaxed">{salesIntel.outreachAngle}</p>
              </div>
            )}
          </div>
        ) : (
          <EmptyAnalysisState
            icon={<SparklesIcon className="w-8 h-8" />}
            message="Generate AI-powered sales intelligence and research"
          />
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// Supporting Components
// ============================================================================

function ScoreGauge({ label, score }: { label: string; score: number }) {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 90) return "var(--score-green)";
    if (s >= 70) return "var(--score-yellow)";
    if (s >= 50) return "var(--score-orange)";
    return "var(--score-red)";
  };

  const color = getColor(score);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-20 h-20">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="6"
            fill="none"
          />
          {/* Progress circle */}
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            stroke={color}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: [0.25, 1, 0.5, 1], delay: 0.2 }}
            style={{ filter: `drop-shadow(0 0 8px ${color}40)` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-xl font-bold"
            style={{ color }}
          >
            {score}
          </motion.span>
        </div>
      </div>
      <p className="mt-2 text-xs text-gray-400 text-center">{label}</p>
    </div>
  );
}

function AnalyzeButton({
  onClick,
  loading,
  hasData,
  cost,
  label,
}: {
  onClick: () => void;
  loading: boolean;
  hasData: boolean;
  cost: number;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`
        relative inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold
        transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
        ${hasData
          ? "bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 hover:border-white/20"
          : "bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-black"
        }
      `}
    >
      {loading ? (
        <>
          <LoadingSpinner />
          <span>Analyzing...</span>
        </>
      ) : (
        <>
          {hasData ? <RefreshIcon className="w-3.5 h-3.5" /> : <PlayIcon className="w-3.5 h-3.5" />}
          <span>{label || (hasData ? "Refresh" : "Analyze")}</span>
          <span className="px-1.5 py-0.5 bg-black/20 rounded text-[10px] font-bold">
            {cost} CR
          </span>
        </>
      )}
    </button>
  );
}

function CostConfirmationModal({
  type,
  cost,
  onConfirm,
  onCancel,
}: {
  type: string;
  cost: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const typeLabels: Record<string, { title: string; desc: string }> = {
    lighthouse: { title: "Lighthouse Audit", desc: "Analyze website performance, SEO, and accessibility" },
    techStack: { title: "Tech Stack Scan", desc: "Detect frameworks, CMS, and technologies used" },
    salesIntel: { title: "Sales Intelligence", desc: "Generate AI-powered research and talking points" },
  };

  const { title, desc } = typeLabels[type] || { title: "Analysis", desc: "" };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-[var(--gray-850)] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
      >
        {/* Credit visualization */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-[var(--accent)]/10 flex items-center justify-center border border-[var(--accent)]/30">
              <span className="text-3xl font-bold text-[var(--accent)]">{cost}</span>
            </div>
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-[var(--accent)]"
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 1.3, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
          </div>
        </div>

        <h3 className="text-lg font-semibold text-white text-center mb-1">{title}</h3>
        <p className="text-sm text-gray-400 text-center mb-6">{desc}</p>

        <div className="p-3 bg-black/30 rounded-lg mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Credit Cost</span>
            <span className="font-semibold text-white">{cost} credit{cost > 1 ? "s" : ""}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-black text-sm font-semibold transition-colors"
          >
            Confirm
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function EmptyAnalysisState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-gray-600 mb-4">
        {icon}
      </div>
      <p className="text-sm text-gray-500 max-w-xs">{message}</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertIcon className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-orange-400">Analysis Failed</p>
          <p className="text-xs text-gray-400 mt-1">{message}</p>
        </div>
      </div>
    </div>
  );
}

function NoWebsiteState({ businessName }: { businessName: string }) {
  return (
    <div className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-2xl p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center mx-auto mb-4">
        <GlobeOffIcon className="w-8 h-8 text-gray-600" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">No Website Found</h3>
      <p className="text-sm text-gray-500 max-w-sm mx-auto">
        {businessName} doesn&apos;t have a website on file. Website analysis features are unavailable.
      </p>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-black/20 border border-white/5 rounded-lg p-3">
      <div className="flex items-center gap-2 text-gray-500 mb-1">
        {icon}
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-sm font-semibold text-white truncate">{value}</p>
    </div>
  );
}

function SectionLabel({ icon, label, color = "gray" }: { icon: React.ReactNode; label: string; color?: string }) {
  const colorClasses: Record<string, string> = {
    gray: "text-gray-500",
    red: "text-red-400",
    green: "text-green-400",
    blue: "text-blue-400",
    purple: "text-purple-400",
  };

  return (
    <div className={`flex items-center gap-2 ${colorClasses[color]}`}>
      {icon}
      <span className="text-[11px] uppercase tracking-wider font-semibold">{label}</span>
    </div>
  );
}

function StatusBadge({ positive, label }: { positive: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
        positive
          ? "bg-green-500/10 text-green-400 border-green-500/20"
          : "bg-red-500/10 text-red-400 border-red-500/20"
      }`}
    >
      {positive ? <CheckIcon className="w-3 h-3" /> : <XIcon className="w-3 h-3" />}
      {label}
    </span>
  );
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ============================================================================
// Icons
// ============================================================================

function AnalysisIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
    </svg>
  );
}

function SignalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.348 14.652a3.75 3.75 0 010-5.304m5.304 0a3.75 3.75 0 010 5.304m-7.425 2.121a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c-3.808-3.807-3.808-9.98 0-13.788m13.788 0c3.808 3.807 3.808 9.98 0 13.788M12 12h.008v.008H12V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  );
}

function LighthouseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
    </svg>
  );
}

function StackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5.14v14l11-7-11-7z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function DollarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  );
}

function UserCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function EmailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function TargetIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0M12 3v3M12 18v3M3 12h3M18 12h3" />
    </svg>
  );
}

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
    </svg>
  );
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
  );
}

function GlobeOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18zM3.6 9h16.8M3.6 15h16.8M11.5 3a17 17 0 000 18M12.5 3a17 17 0 010 18M2 2l20 20" />
    </svg>
  );
}
