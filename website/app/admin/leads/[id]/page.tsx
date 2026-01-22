'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

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
  websiteNeedsRedesign: boolean;
  perplexityAnalysis: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  tags: { id: string; name: string; color: string }[];
  activities: Activity[];
  assignedTo: { id: string; name: string; email: string } | null;
}

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string | null;
  outcome: string | null;
  createdAt: string;
  completedAt: string | null;
  user: { id: string; name: string };
}

const STAGES = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];

const STAGE_COLORS: Record<string, { bg: string; text: string }> = {
  NEW: { bg: 'bg-blue-500', text: 'text-blue-400' },
  CONTACTED: { bg: 'bg-yellow-500', text: 'text-yellow-400' },
  QUALIFIED: { bg: 'bg-purple-500', text: 'text-purple-400' },
  PROPOSAL: { bg: 'bg-cyan-500', text: 'text-cyan-400' },
  NEGOTIATION: { bg: 'bg-orange-500', text: 'text-orange-400' },
  WON: { bg: 'bg-green-500', text: 'text-green-400' },
  LOST: { bg: 'bg-red-500', text: 'text-red-400' },
};

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [activityModal, setActivityModal] = useState(false);
  const [newActivity, setNewActivity] = useState({ type: 'NOTE', title: '', description: '' });
  const [saving, setSaving] = useState(false);

  const fetchLead = async () => {
    try {
      const data = await apiClient.getLead(params.id as string);
      setLead(data);
    } catch (error) {
      console.error('Failed to fetch lead:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLead();
  }, [params.id]);

  const handleStageChange = async (newStage: string) => {
    if (!lead || lead.stage === newStage) return;

    try {
      await apiClient.changeLeadStage(lead.id, newStage);
      fetchLead();
    } catch (error) {
      console.error('Failed to change stage:', error);
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead || !newActivity.title) return;

    setSaving(true);
    try {
      await apiClient.createActivity({
        leadId: lead.id,
        type: newActivity.type,
        title: newActivity.title,
        description: newActivity.description || undefined,
      });
      setActivityModal(false);
      setNewActivity({ type: 'NOTE', title: '', description: '' });
      fetchLead();
    } catch (error) {
      console.error('Failed to create activity:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLead = async () => {
    if (!lead || !confirm('Are you sure you want to delete this lead?')) return;

    try {
      await apiClient.deleteLead(lead.id);
      router.push('/admin/leads');
    } catch (error) {
      console.error('Failed to delete lead:', error);
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
        <Link href="/admin/leads" className="text-accent hover:text-accent-light mt-2 inline-block">
          ← Back to leads
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/admin/leads"
            className="text-sm text-gray-400 hover:text-white transition-colors mb-2 inline-block"
          >
            ← Back to leads
          </Link>
          <h1 className="text-2xl font-bold">{lead.businessName}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-medium ${STAGE_COLORS[lead.stage].bg} text-white`}
            >
              {lead.stage}
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-sm text-gray-400">{lead.category}</span>
            {lead.city && (
              <>
                <span className="text-gray-400">•</span>
                <span className="text-sm text-gray-400">{lead.city}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActivityModal(true)}
            className="px-4 py-2 bg-accent text-background font-medium rounded-lg hover:bg-accent-light transition-colors"
          >
            Add Activity
          </button>
          <button
            onClick={handleDeleteLead}
            className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Stage Pipeline */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="flex items-center gap-1">
          {STAGES.map((stage, index) => {
            const isActive = lead.stage === stage;
            const isPast = STAGES.indexOf(lead.stage) > index;

            return (
              <button
                key={stage}
                onClick={() => handleStageChange(stage)}
                className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-colors ${
                  isActive
                    ? `${STAGE_COLORS[stage].bg} text-white`
                    : isPast
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {stage.replace('_', ' ')}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Info */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="Contact Person" value={lead.contactPerson} />
              <InfoItem label="Email" value={lead.email} isLink />
              <InfoItem label="Phone" value={lead.phone} />
              <InfoItem
                label="Website"
                value={lead.website}
                isExternalLink
              />
              <InfoItem label="Address" value={lead.address} />
              <InfoItem
                label="Location"
                value={[lead.city, lead.state, lead.country].filter(Boolean).join(', ')}
              />
            </div>
          </div>

          {/* Website Analysis */}
          {lead.hasWebsite && (
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-lg font-semibold mb-4">Website Analysis</h2>
              <div className="grid grid-cols-2 gap-4">
                <ScoreCard
                  label="Performance"
                  score={lead.lighthouseScore}
                />
                <ScoreCard label="SEO" score={lead.lighthouseSeo} />
              </div>
              {lead.websiteNeedsRedesign && (
                <div className="mt-4 p-3 bg-accent/10 border border-accent/20 rounded-lg">
                  <p className="text-sm text-accent">
                    This website may need a redesign based on analysis.
                  </p>
                </div>
              )}
              {lead.perplexityAnalysis && (
                <div className="mt-4">
                  <p className="text-sm text-gray-400 mb-2">AI Analysis:</p>
                  <p className="text-sm text-gray-300">{lead.perplexityAnalysis}</p>
                </div>
              )}
            </div>
          )}

          {/* Activities Timeline */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-lg font-semibold mb-4">Activity Timeline</h2>
            {lead.activities.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No activities yet</p>
            ) : (
              <div className="space-y-4">
                {lead.activities.map((activity) => (
                  <div key={activity.id} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                      <ActivityIcon type={activity.type} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-white">{activity.title}</p>
                        <span className="text-xs text-gray-400">
                          {new Date(activity.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {activity.description && (
                        <p className="text-sm text-gray-400 mt-1">
                          {activity.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        by {activity.user.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Score */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-lg font-semibold mb-4">Lead Score</h2>
            <div className="text-center">
              <div className="text-5xl font-bold text-accent mb-2">{lead.score}</div>
              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all"
                  style={{ width: `${lead.score}%` }}
                />
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-lg font-semibold mb-4">Details</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Source</span>
                <span className="text-white">{lead.source.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Lead Type</span>
                <span className="text-white">{lead.leadType.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Priority</span>
                <span className="text-white">{lead.priority}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Has Website</span>
                <span className="text-white">{lead.hasWebsite ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Created</span>
                <span className="text-white">
                  {new Date(lead.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-lg font-semibold mb-4">Tags</h2>
            {lead.tags.length === 0 ? (
              <p className="text-sm text-gray-400">No tags</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {lead.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          {lead.notes && (
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-lg font-semibold mb-4">Notes</h2>
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{lead.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Activity Modal */}
      {activityModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
            <h2 className="text-lg font-semibold mb-4">Add Activity</h2>
            <form onSubmit={handleAddActivity} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Type
                </label>
                <select
                  value={newActivity.type}
                  onChange={(e) => setNewActivity({ ...newActivity, type: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-accent"
                >
                  <option value="NOTE">Note</option>
                  <option value="CALL">Call</option>
                  <option value="EMAIL">Email</option>
                  <option value="MEETING">Meeting</option>
                  <option value="TASK">Task</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={newActivity.title}
                  onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-accent"
                  placeholder="Activity title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={newActivity.description}
                  onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-accent resize-none"
                  rows={3}
                  placeholder="Add details..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setActivityModal(false)}
                  className="flex-1 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 bg-accent text-background font-medium rounded-lg hover:bg-accent-light transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Add Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoItem({
  label,
  value,
  isLink,
  isExternalLink,
}: {
  label: string;
  value: string | null;
  isLink?: boolean;
  isExternalLink?: boolean;
}) {
  if (!value) {
    return (
      <div>
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className="text-gray-400">—</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      {isExternalLink ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:text-accent-light transition-colors text-sm break-all"
        >
          {value}
        </a>
      ) : isLink ? (
        <a
          href={`mailto:${value}`}
          className="text-accent hover:text-accent-light transition-colors text-sm"
        >
          {value}
        </a>
      ) : (
        <p className="text-white text-sm">{value}</p>
      )}
    </div>
  );
}

function ScoreCard({ label, score }: { label: string; score: number | null }) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-green-400';
    if (s >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-gray-700/50 rounded-lg p-4 text-center">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      {score !== null ? (
        <p className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}</p>
      ) : (
        <p className="text-gray-400">—</p>
      )}
    </div>
  );
}

function ActivityIcon({ type }: { type: string }) {
  const className = 'w-4 h-4';
  switch (type) {
    case 'CALL':
      return (
        <svg className={`${className} text-green-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      );
    case 'EMAIL':
      return (
        <svg className={`${className} text-blue-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    case 'MEETING':
      return (
        <svg className={`${className} text-purple-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'TASK':
      return (
        <svg className={`${className} text-orange-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      );
    default:
      return (
        <svg className={`${className} text-gray-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      );
  }
}
