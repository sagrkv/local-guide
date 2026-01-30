"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { ActivityTimeline, Activity } from "@/components/dashboard/ActivityTimeline";
import AnalysisPanel from "@/components/dashboard/AnalysisPanel";
import { RemindMeButton } from "@/components/reminders/RemindMeButton";

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
  salesIntelligence: Record<string, unknown> | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  tags: { id: string; name: string; color: string }[];
  activities: Activity[];
}

const STAGES = ["NEW", "CONTACTED", "INTERESTED", "CLOSED"];

const STAGE_CONFIG: Record<string, { bg: string; text: string; border: string; label: string }> = {
  NEW: { bg: "bg-blue-500", text: "text-blue-400", border: "border-blue-500/30", label: "New" },
  CONTACTED: { bg: "bg-amber-500", text: "text-amber-400", border: "border-amber-500/30", label: "Contacted" },
  INTERESTED: { bg: "bg-purple-500", text: "text-purple-400", border: "border-purple-500/30", label: "Interested" },
  CLOSED: { bg: "bg-emerald-500", text: "text-emerald-400", border: "border-emerald-500/30", label: "Closed" },
};

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLead = useCallback(async () => {
    try {
      const data = await apiClient.getLead(params.id as string);
      setLead(data);
    } catch {
      toast.error("Failed to load lead");
      router.push("/dashboard/leads");
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    fetchLead();
  }, [fetchLead]);

  const handleStageChange = async (newStage: string) => {
    if (!lead || lead.stage === newStage) return;

    try {
      await apiClient.changeLeadStage(lead.id, newStage);
      toast.success(`Stage changed to ${STAGE_CONFIG[newStage].label}`);
      fetchLead();
    } catch {
      toast.error("Failed to change stage");
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
        <Link href="/dashboard/leads" className="text-accent hover:text-[#FF8C40] mt-2 inline-block">
          Back to Leads
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard/leads"
            className="text-gray-400 hover:text-white text-sm mb-3 inline-flex items-center gap-1.5 transition-colors group"
          >
            <ChevronLeftIcon className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Leads
          </Link>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
            {lead.businessName}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${STAGE_CONFIG[lead.stage].bg} text-white`}>
              {STAGE_CONFIG[lead.stage].label}
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
                          ? "bg-emerald-500 text-white"
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
                          ? "text-emerald-400"
                          : "text-gray-500 group-hover:text-gray-400"
                    }`}
                  >
                    {STAGE_CONFIG[stage].label}
                  </span>
                </button>
                {!isLast && (
                  <div className={`h-0.5 flex-1 min-w-[20px] transition-colors ${isPast ? "bg-emerald-500" : "bg-gray-700"}`} />
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
              <InfoField label="Contact Person" value={lead.contactPerson} icon={<UserIcon className="w-4 h-4" />} />
              <InfoField label="Email" value={lead.email} icon={<EmailIcon className="w-4 h-4" />} isEmail />
              <InfoField label="Phone" value={lead.phone} icon={<PhoneIcon className="w-4 h-4" />} isPhone />
              <InfoField label="Website" value={lead.website} icon={<GlobeIcon className="w-4 h-4" />} isLink />
              <InfoField label="Address" value={lead.address} icon={<MapPinIcon className="w-4 h-4" />} />
              <InfoField label="Location" value={[lead.city, lead.state, lead.country].filter(Boolean).join(", ")} icon={<LocationIcon className="w-4 h-4" />} />
            </div>
          </Card>

          {/* Website Analysis Panel */}
          <AnalysisPanel lead={lead} onAnalysisComplete={fetchLead} />

          {/* Activity Timeline */}
          <Card title="Activity Timeline" icon={<ActivityIcon className="text-gray-400" />}>
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
              <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">Lead Score</p>
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="none" className="text-gray-700" />
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
                <span className="absolute text-4xl font-bold text-white">{lead.score}</span>
              </div>
              <p className="text-gray-400 text-sm mt-2">out of 100</p>
            </div>
          </Card>

          {/* Details */}
          <Card title="Details">
            <div className="space-y-3">
              <DetailRow label="Source" value={lead.source.replace("_", " ")} />
              <DetailRow label="Lead Type" value={lead.leadType.replace("_", " ")} />
              <DetailRow label="Priority" value={lead.priority} />
              <DetailRow
                label="Has Website"
                value={<span className={lead.hasWebsite ? "text-emerald-400" : "text-gray-500"}>{lead.hasWebsite ? "Yes" : "No"}</span>}
              />
              <DetailRow label="Created" value={new Date(lead.createdAt).toLocaleDateString()} />
              <DetailRow label="Updated" value={new Date(lead.updatedAt).toLocaleDateString()} />
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
              <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{lead.notes}</p>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}

// Reusable Components
function Card({
  title,
  icon,
  children,
}: {
  title?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden backdrop-blur-sm">
      {title && (
        <div className="flex items-center gap-3 p-5 border-b border-gray-700/50">
          {icon && <span className="text-gray-400">{icon}</span>}
          <h2 className="text-base font-semibold text-white">{title}</h2>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
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
          <p className="text-gray-600">-</p>
        </div>
      </div>
    );
  }

  let content = <span className="text-white">{value}</span>;

  if (isEmail) {
    content = (
      <a href={`mailto:${value}`} className="text-accent hover:text-[#FF8C40] transition-colors">
        {value}
      </a>
    );
  } else if (isPhone) {
    content = (
      <a href={`tel:${value}`} className="text-accent hover:text-[#FF8C40] transition-colors">
        {value}
      </a>
    );
  } else if (isLink) {
    content = (
      <a
        href={value.startsWith("http") ? value : `https://${value}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-accent hover:text-[#FF8C40] transition-colors truncate block"
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

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-400">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}

// Icons
function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function LocationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function ContactIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function EmailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ActivityIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
