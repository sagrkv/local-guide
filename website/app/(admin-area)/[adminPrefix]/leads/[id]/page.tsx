"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { ActivityTimeline, Activity } from "@/components/dashboard/ActivityTimeline";
import AnalysisPanel from "@/components/dashboard/AnalysisPanel";
import { RemindMeButton } from "@/components/reminders/RemindMeButton";

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
  techStack?: TechStack;
  techStackAnalyzedAt?: string;
}

interface GeneratedEmail {
  subject: string;
  body: string;
}

interface Lead {
  id: string;
  businessName: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  category: string;
  stage: string;
  priority: string;
  score: number;
  source: string;
  leadType: string;
  hasWebsite: boolean;
  lighthouseScore: number | null;
  lighthouseSeo: number | null;
  lighthouseAccessibility: number | null;
  lighthouseBestPractices: number | null;
  websiteNeedsRedesign: boolean;
  qualificationError: string | null;
  perplexityAnalysis: string | null;
  salesIntelligence: SalesIntelligence | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  tags: { id: string; name: string; color: string }[];
  activities: Activity[];
  assignedTo: { id: string; name: string; email: string } | null;
}

// Activity interface is imported from ActivityTimeline component

// ============================================================================
// Constants
// ============================================================================

const STAGES = [
  "NEW",
  "CONTACTED",
  "INTERESTED",
  "CLOSED",
];

const STAGE_CONFIG: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  NEW: {
    bg: "bg-blue-500",
    text: "text-blue-400",
    border: "border-blue-500/30",
  },
  CONTACTED: {
    bg: "bg-yellow-500",
    text: "text-yellow-400",
    border: "border-yellow-500/30",
  },
  INTERESTED: {
    bg: "bg-purple-500",
    text: "text-purple-400",
    border: "border-purple-500/30",
  },
  CLOSED: {
    bg: "bg-green-500",
    text: "text-green-400",
    border: "border-green-500/30",
  },
};

// ============================================================================
// Main Component
// ============================================================================

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailLoading, setEmailLoading] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState<GeneratedEmail | null>(
    null,
  );

  const fetchLead = useCallback(async () => {
    try {
      const data = await apiClient.getLead(params.id as string);
      setLead(data);
    } catch {
      toast.error("Failed to load lead");
      router.push("/admin/leads");
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    fetchLead();
  }, [fetchLead]);

  const handleGenerateEmail = async () => {
    if (!lead) return;
    setEmailLoading(true);
    try {
      const email = await apiClient.generateOutreachEmail(lead.id);
      setGeneratedEmail(email);
      toast.success("Email generated");
    } catch {
      toast.error("Failed to generate email");
    } finally {
      setEmailLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleStageChange = async (newStage: string) => {
    if (!lead || lead.stage === newStage) return;

    try {
      await apiClient.changeLeadStage(lead.id, newStage);
      toast.success(`Stage changed to ${newStage}`);
      fetchLead();
    } catch {
      toast.error("Failed to change stage");
    }
  };

  const handleDeleteLead = async () => {
    if (!lead || !confirm("Are you sure you want to delete this lead?")) return;

    try {
      await apiClient.deleteLead(lead.id);
      toast.success("Lead deleted");
      router.push("/admin/leads");
    } catch {
      toast.error("Failed to delete lead");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Lead not found</p>
        <Link
          href="/admin/leads"
          className="text-accent hover:text-accent-light mt-2 inline-block"
        >
          Back to Leads
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/leads"
            className="text-gray-400 hover:text-white text-sm mb-3 inline-flex items-center gap-1.5 transition-colors group"
          >
            <ChevronLeftIcon className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Leads
          </Link>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            {lead.businessName}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span
              className={`px-2.5 py-1 rounded-md text-xs font-semibold ${STAGE_CONFIG[lead.stage].bg} text-white`}
            >
              {lead.stage}
            </span>
            <span className="px-2.5 py-1 bg-gray-700/50 text-gray-300 text-xs font-medium rounded-md border border-gray-600/50">
              {lead.category.replace("_", " ")}
            </span>
            {lead.city && (
              <span className="text-gray-500 text-sm flex items-center gap-1">
                <LocationIcon className="w-3.5 h-3.5" />
                {lead.city}
                {lead.state && `, ${lead.state}`}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <RemindMeButton leadId={lead.id} onReminderCreated={fetchLead} />
          <ActionButton onClick={handleDeleteLead} variant="danger">
            Delete
          </ActionButton>
        </div>
      </header>

      {/* Stage Pipeline */}
      <Card>
        <div className="flex items-center overflow-x-auto pb-2">
          {STAGES.map((stage, index) => {
            const isActive = lead.stage === stage;
            const isPast = STAGES.indexOf(lead.stage) > index;
            const isLast = index === STAGES.length - 1;

            return (
              <div key={stage} className="flex items-center flex-1 min-w-0">
                <button
                  onClick={() => handleStageChange(stage)}
                  className="relative flex flex-col items-center justify-center py-2 px-1 flex-1 min-w-[80px] group"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isActive
                        ? `${STAGE_CONFIG[stage].bg} text-white ring-4 ring-white/10`
                        : isPast
                          ? "bg-green-500 text-white"
                          : "bg-gray-700 text-gray-400 group-hover:bg-gray-600"
                    }`}
                  >
                    {isPast ? <CheckIcon className="w-4 h-4" /> : index + 1}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium transition-colors whitespace-nowrap ${
                      isActive
                        ? STAGE_CONFIG[stage].text
                        : isPast
                          ? "text-green-400"
                          : "text-gray-500 group-hover:text-gray-400"
                    }`}
                  >
                    {stage}
                  </span>
                </button>
                {!isLast && (
                  <div
                    className={`h-0.5 flex-1 min-w-[20px] transition-colors ${
                      isPast ? "bg-green-500" : "bg-gray-700"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Main Content */}
        <div className="xl:col-span-8 space-y-6">
          {/* Contact Information */}
          <Card title="Contact Information" icon={<ContactIcon />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField
                label="Contact Person"
                value={lead.contactPerson}
                icon={<UserIcon className="w-4 h-4" />}
              />
              <InfoField
                label="Email"
                value={lead.email}
                icon={<EmailIcon className="w-4 h-4" />}
                isEmail
              />
              <InfoField
                label="Phone"
                value={lead.phone}
                icon={<PhoneIcon className="w-4 h-4" />}
                isPhone
              />
              <InfoField
                label="Website"
                value={lead.website}
                icon={<GlobeIcon className="w-4 h-4" />}
                isLink
              />
              <InfoField
                label="Address"
                value={lead.address}
                icon={<MapPinIcon className="w-4 h-4" />}
              />
              <InfoField
                label="Location"
                value={[lead.city, lead.state, lead.country]
                  .filter(Boolean)
                  .join(", ")}
                icon={<LocationIcon className="w-4 h-4" />}
              />
            </div>
          </Card>

          {/* Website Analysis Panel - Lighthouse, Tech Stack, Sales Intelligence */}
          <AnalysisPanel lead={lead} onAnalysisComplete={fetchLead} />

          {/* Generated Email */}
          <Card
            title="Generated Outreach Email"
            icon={<MailIcon className="text-blue-400" />}
            actions={
              <div className="flex items-center gap-2">
                {generatedEmail && (
                  <ActionButton
                    onClick={() =>
                      copyToClipboard(
                        `Subject: ${generatedEmail.subject}\n\n${generatedEmail.body}`,
                        "Email",
                      )
                    }
                    variant="ghost"
                    size="sm"
                  >
                    Copy
                  </ActionButton>
                )}
                <ActionButton
                  onClick={handleGenerateEmail}
                  disabled={emailLoading}
                  variant="primary"
                  size="sm"
                  loading={emailLoading}
                >
                  {emailLoading
                    ? "Generating..."
                    : generatedEmail
                      ? "Regenerate"
                      : "Generate"}
                </ActionButton>
              </div>
            }
          >
            {!generatedEmail ? (
              <EmptyState
                icon={<MailIcon className="w-12 h-12" />}
                message="No email generated yet"
                subtext="Click 'Generate' to create a personalized outreach email"
              />
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">
                    Subject Line
                  </p>
                  <p className="text-white bg-gray-900/50 p-3 rounded-lg border border-gray-700/50">
                    {generatedEmail.subject}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">
                    Email Body
                  </p>
                  <div className="text-gray-300 bg-gray-900/50 p-4 rounded-lg border border-gray-700/50 whitespace-pre-wrap text-sm leading-relaxed">
                    {generatedEmail.body}
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Activity Timeline */}
          <Card
            title="Activity Timeline"
            icon={<ActivityIcon className="text-gray-400" />}
          >
            <ActivityTimeline
              leadId={lead.id}
              activities={lead.activities as Activity[]}
              onActivityCreated={fetchLead}
              onActivityCompleted={fetchLead}
            />
          </Card>
        </div>

        {/* Sidebar */}
        <aside className="xl:col-span-4 space-y-6">
          {/* Score Card */}
          <Card>
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">
                Lead Score
              </p>
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-700"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${(lead.score / 100) * 352} 352`}
                    className="text-accent transition-all duration-1000"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-4xl font-bold text-white">
                  {lead.score}
                </span>
              </div>
              <p className="text-gray-400 text-sm mt-2">out of 100</p>
            </div>
          </Card>

          {/* Details */}
          <Card title="Details">
            <div className="space-y-3">
              <DetailRow label="Source" value={lead.source.replace("_", " ")} />
              <DetailRow
                label="Lead Type"
                value={lead.leadType.replace("_", " ")}
              />
              <DetailRow label="Priority" value={lead.priority} />
              <DetailRow
                label="Has Website"
                value={
                  <span
                    className={
                      lead.hasWebsite ? "text-green-400" : "text-gray-500"
                    }
                  >
                    {lead.hasWebsite ? "Yes" : "No"}
                  </span>
                }
              />
              <DetailRow
                label="Created"
                value={new Date(lead.createdAt).toLocaleDateString()}
              />
              <DetailRow
                label="Updated"
                value={new Date(lead.updatedAt).toLocaleDateString()}
              />
            </div>
          </Card>

          {/* Tags */}
          <Card title="Tags">
            {lead.tags.length === 0 ? (
              <p className="text-sm text-gray-500">No tags assigned</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {lead.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="px-2.5 py-1 rounded-md text-xs font-medium"
                    style={{
                      backgroundColor: `${tag.color}20`,
                      color: tag.color,
                      borderWidth: 1,
                      borderColor: `${tag.color}40`,
                    }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </Card>

          {/* Notes */}
          {lead.notes && (
            <Card title="Notes">
              <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                {lead.notes}
              </p>
            </Card>
          )}

          {/* Assigned To */}
          {lead.assignedTo && (
            <Card title="Assigned To">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold">
                  {lead.assignedTo.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-medium">
                    {lead.assignedTo.name}
                  </p>
                  <p className="text-sm text-gray-400">
                    {lead.assignedTo.email}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </aside>
      </div>

    </div>
  );
}

// ============================================================================
// Reusable Components
// ============================================================================

function Card({
  title,
  subtitle,
  icon,
  actions,
  children,
}: {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden backdrop-blur-sm">
      {(title || actions) && (
        <div className="flex items-center justify-between p-5 border-b border-gray-700/50">
          <div className="flex items-center gap-3">
            {icon && <span className="text-gray-400">{icon}</span>}
            <div>
              <h2 className="text-base font-semibold text-white">{title}</h2>
              {subtitle && (
                <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          {actions}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  variant = "primary",
  size = "md",
  loading,
  icon,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?:
    | "primary"
    | "secondary"
    | "success"
    | "danger"
    | "warning"
    | "info"
    | "purple"
    | "ghost";
  size?: "sm" | "md";
  loading?: boolean;
  icon?: React.ReactNode;
}) {
  const variants = {
    primary: "bg-accent hover:bg-accent-light text-background",
    secondary: "bg-gray-700 hover:bg-gray-600 text-white",
    success: "bg-green-600 hover:bg-green-500 text-white",
    danger:
      "bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30",
    warning: "bg-orange-600 hover:bg-orange-500 text-white",
    info: "bg-cyan-600 hover:bg-cyan-500 text-white",
    purple: "bg-purple-600 hover:bg-purple-500 text-white",
    ghost: "bg-gray-700/50 hover:bg-gray-700 text-gray-300",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${variants[variant]} ${sizes[size]} font-medium rounded-lg disabled:opacity-50 transition-all duration-200 flex items-center gap-2`}
    >
      {loading ? (
        <span className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent" />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}

function InfoField({
  label,
  value,
  icon,
  isEmail,
  isPhone,
  isLink,
}: {
  label: string;
  value: string | null;
  icon?: React.ReactNode;
  isEmail?: boolean;
  isPhone?: boolean;
  isLink?: boolean;
}) {
  if (!value) {
    return (
      <div className="flex items-start gap-3">
        {icon && <span className="text-gray-600 mt-0.5">{icon}</span>}
        <div>
          <p className="text-xs text-gray-500 mb-0.5">{label}</p>
          <p className="text-gray-600">—</p>
        </div>
      </div>
    );
  }

  let content = <span className="text-white">{value}</span>;

  if (isEmail) {
    content = (
      <a
        href={`mailto:${value}`}
        className="text-accent hover:text-accent-light transition-colors"
      >
        {value}
      </a>
    );
  } else if (isPhone) {
    content = (
      <a
        href={`tel:${value}`}
        className="text-accent hover:text-accent-light transition-colors"
      >
        {value}
      </a>
    );
  } else if (isLink) {
    content = (
      <a
        href={value.startsWith("http") ? value : `https://${value}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-accent hover:text-accent-light transition-colors truncate block"
      >
        {value}
      </a>
    );
  }

  return (
    <div className="flex items-start gap-3">
      {icon && <span className="text-gray-500 mt-0.5">{icon}</span>}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        {content}
      </div>
    </div>
  );
}

function ScoreCard({ label, score }: { label: string; score: number | null }) {
  const getScoreColor = (s: number | null) => {
    if (s === null) return "text-gray-500";
    if (s >= 90) return "text-green-400";
    if (s >= 70) return "text-yellow-400";
    if (s >= 50) return "text-orange-400";
    return "text-red-400";
  };

  const getScoreBg = (s: number | null) => {
    if (s === null) return "bg-gray-800/50 border-gray-700/50";
    if (s >= 90) return "bg-green-500/10 border-green-500/30";
    if (s >= 70) return "bg-yellow-500/10 border-yellow-500/30";
    if (s >= 50) return "bg-orange-500/10 border-orange-500/30";
    return "bg-red-500/10 border-red-500/30";
  };

  return (
    <div
      className={`${getScoreBg(score)} rounded-lg p-4 text-center border transition-all duration-300`}
    >
      <p className={`text-2xl font-bold ${getScoreColor(score)}`}>
        {score !== null ? score : "—"}
      </p>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
    </div>
  );
}

function SectionLabel({
  label,
  icon,
}: {
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {icon && <span className="text-gray-400">{icon}</span>}
      <h3 className="text-sm font-medium text-gray-400">{label}</h3>
    </div>
  );
}

function EmptyState({
  icon,
  message,
  subtext,
}: {
  icon?: React.ReactNode;
  message: string;
  subtext?: string;
}) {
  return (
    <div className="text-center py-8 text-gray-400">
      {icon && <div className="mx-auto mb-3 opacity-30">{icon}</div>}
      <p className="text-gray-400">{message}</p>
      {subtext && <p className="text-sm text-gray-500 mt-1">{subtext}</p>}
    </div>
  );
}

function ErrorAlert({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
      <div className="flex items-start gap-3">
        <WarningIcon className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-orange-400 font-medium">{title}</p>
          <p className="text-gray-400 text-sm mt-1">{message}</p>
          {action && <div className="mt-3">{action}</div>}
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-400">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}

function TechStackDisplay({ techStack }: { techStack: TechStack }) {
  return (
    <div className="space-y-4">
      {/* Core Technologies */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {techStack.cms && <TechStackItem label="CMS" value={techStack.cms} />}
        {techStack.framework && (
          <TechStackItem label="Framework" value={techStack.framework} />
        )}
        {techStack.hosting && (
          <TechStackItem label="Hosting" value={techStack.hosting} />
        )}
        {techStack.ecommerce && (
          <TechStackItem label="E-commerce" value={techStack.ecommerce} />
        )}
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-2">
        {techStack.security && (
          <span
            className={`px-2.5 py-1 rounded-md text-xs font-medium ${
              techStack.security.hasSSL
                ? "bg-green-500/20 text-green-400"
                : "bg-red-500/20 text-red-400"
            }`}
          >
            {techStack.security.hasSSL ? "SSL Active" : "No SSL"}
          </span>
        )}
        {techStack.mobile && (
          <span
            className={`px-2.5 py-1 rounded-md text-xs font-medium ${
              techStack.mobile.isResponsive
                ? "bg-green-500/20 text-green-400"
                : "bg-orange-500/20 text-orange-400"
            }`}
          >
            {techStack.mobile.isResponsive
              ? "Mobile Responsive"
              : "Not Responsive"}
          </span>
        )}
        {techStack.performance?.estimatedLoadTime && (
          <span className="px-2.5 py-1 bg-gray-700/50 text-gray-300 text-xs rounded-md">
            Load: {techStack.performance.estimatedLoadTime}
          </span>
        )}
      </div>

      {/* Tools Grid */}
      {((techStack.analytics && techStack.analytics.length > 0) ||
        (techStack.marketing && techStack.marketing.length > 0) ||
        (techStack.chatbots && techStack.chatbots.length > 0)) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {techStack.analytics && techStack.analytics.length > 0 && (
            <TechToolList
              label="Analytics"
              items={techStack.analytics}
              color="blue"
            />
          )}
          {techStack.marketing && techStack.marketing.length > 0 && (
            <TechToolList
              label="Marketing"
              items={techStack.marketing}
              color="purple"
            />
          )}
          {techStack.chatbots && techStack.chatbots.length > 0 && (
            <TechToolList
              label="Chat/Support"
              items={techStack.chatbots}
              color="green"
            />
          )}
        </div>
      )}

      {/* Other Technologies */}
      {techStack.otherTechnologies &&
        techStack.otherTechnologies.length > 0 && (
          <TechToolList
            label="Other Technologies"
            items={techStack.otherTechnologies}
            color="gray"
          />
        )}

      {/* Performance Issues */}
      {techStack.performance?.issues &&
        techStack.performance.issues.length > 0 && (
          <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
            <p className="text-xs text-orange-400 font-semibold mb-2 uppercase tracking-wider">
              Issues Detected
            </p>
            <ul className="space-y-1.5">
              {techStack.performance.issues.map((issue, idx) => (
                <li
                  key={idx}
                  className="text-sm text-orange-300 flex items-start gap-2"
                >
                  <WarningIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        )}

      {/* Recommendations */}
      {techStack.recommendations && techStack.recommendations.length > 0 && (
        <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
          <p className="text-xs text-cyan-400 font-semibold mb-2 uppercase tracking-wider">
            Recommendations
          </p>
          <ul className="space-y-1.5">
            {techStack.recommendations.map((rec, idx) => (
              <li
                key={idx}
                className="text-sm text-gray-300 flex items-start gap-2"
              >
                <span className="text-cyan-400">→</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function TechStackItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/50">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-white font-medium text-sm">{value}</p>
    </div>
  );
}

function TechToolList({
  label,
  items,
  color,
}: {
  label: string;
  items: string[];
  color: "blue" | "purple" | "green" | "gray";
}) {
  const colors = {
    blue: "bg-blue-500/20 text-blue-400",
    purple: "bg-purple-500/20 text-purple-400",
    green: "bg-green-500/20 text-green-400",
    gray: "bg-gray-700/50 text-gray-300",
  };

  return (
    <div>
      <p className="text-xs text-gray-500 mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, idx) => (
          <span
            key={idx}
            className={`px-2 py-0.5 ${colors[color]} text-xs rounded-md`}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function SalesIntelligenceDisplay({
  research,
}: {
  research: SalesIntelligence;
}) {
  return (
    <div className="space-y-6">
      {/* Decision Makers */}
      {research.decisionMakers && research.decisionMakers.length > 0 && (
        <div>
          <SectionLabel label="Decision Makers" />
          <div className="space-y-2">
            {research.decisionMakers.map((dm, idx) => (
              <div
                key={idx}
                className="bg-gray-900/50 rounded-lg p-3 flex items-center justify-between border border-gray-700/50"
              >
                <div>
                  <p className="text-white font-medium">{dm.name}</p>
                  {dm.title && (
                    <p className="text-gray-400 text-sm">{dm.title}</p>
                  )}
                </div>
                <div className="flex gap-3">
                  {dm.email && (
                    <a
                      href={`mailto:${dm.email}`}
                      className="text-accent hover:text-accent-light text-sm transition-colors"
                    >
                      {dm.email}
                    </a>
                  )}
                  {dm.linkedin && (
                    <a
                      href={dm.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                    >
                      LinkedIn
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Company Info */}
      <div className="grid grid-cols-2 gap-4">
        {research.companySize && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Company Size</p>
            <p className="text-white">{research.companySize} employees</p>
          </div>
        )}
        {research.estimatedRevenue && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Est. Revenue</p>
            <p className="text-white">{research.estimatedRevenue}</p>
          </div>
        )}
        {research.foundedYear && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Founded</p>
            <p className="text-white">{research.foundedYear}</p>
          </div>
        )}
        {research.industry && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Industry</p>
            <p className="text-white">{research.industry}</p>
          </div>
        )}
      </div>

      {/* Specializations */}
      {research.specializations && research.specializations.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Specializations</p>
          <div className="flex flex-wrap gap-2">
            {research.specializations.map((spec, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 bg-gray-700/50 text-gray-300 text-xs rounded-md"
              >
                {spec}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Pain Points */}
      {research.painPoints && research.painPoints.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">
            Pain Points (Opportunities)
          </p>
          <ul className="space-y-1.5">
            {research.painPoints.map((point, idx) => (
              <li
                key={idx}
                className="text-sm text-gray-300 flex items-start gap-2"
              >
                <span className="text-red-400">•</span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Web Service Needs */}
      {research.webServiceNeeds && research.webServiceNeeds.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Service Opportunities</p>
          <div className="flex flex-wrap gap-2">
            {research.webServiceNeeds.map((need, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 bg-green-500/20 text-green-400 text-xs rounded-md"
              >
                {need}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent News */}
      {research.recentNews && research.recentNews.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Recent News</p>
          <ul className="space-y-1.5">
            {research.recentNews.map((news, idx) => (
              <li
                key={idx}
                className="text-sm text-gray-300 flex items-start gap-2"
              >
                <span className="text-blue-400">→</span>
                {news}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Competitor Websites */}
      {research.competitorWebsites &&
        research.competitorWebsites.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-2">
              Competitors with Better Websites
            </p>
            <div className="space-y-1">
              {research.competitorWebsites.map((url, idx) => (
                <a
                  key={idx}
                  href={url.startsWith("http") ? url : `https://${url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-accent hover:text-accent-light transition-colors"
                >
                  {url}
                </a>
              ))}
            </div>
          </div>
        )}

      {/* Personalized Pitch */}
      {research.personalizedPitch && (
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
          <p className="text-xs text-purple-400 font-semibold mb-2 uppercase tracking-wider">
            Suggested Pitch
          </p>
          <p className="text-gray-300 text-sm leading-relaxed">
            {research.personalizedPitch}
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Icons
// ============================================================================

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 19l-7-7 7-7"
      />
    </svg>
  );
}

function LocationIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function ContactIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}

function EmailIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
      />
    </svg>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
      />
    </svg>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function CodeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
      />
    </svg>
  );
}

function LighthouseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  );
}

function BrainIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
      />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
      />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4v16m8-8H4"
      />
    </svg>
  );
}

function ActivityIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

