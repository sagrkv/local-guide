'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

interface Lead {
  id: string;
  businessName: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  city: string | null;
  stage: string;
  priority: string;
  score: number;
  category: string;
  hasWebsite: boolean;
  createdAt: string;
  tags: { id: string; name: string; color: string }[];
}

const STAGES = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];

const STAGE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  NEW: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
  CONTACTED: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400' },
  QUALIFIED: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400' },
  PROPOSAL: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400' },
  NEGOTIATION: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400' },
  WON: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400' },
  LOST: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' },
};

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: 'bg-red-500',
  HIGH: 'bg-orange-500',
  MEDIUM: 'bg-yellow-500',
  LOW: 'bg-gray-500',
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);

  const fetchLeads = useCallback(async () => {
    try {
      const params: any = { limit: 200 };
      if (searchQuery) params.search = searchQuery;
      if (selectedCategory) params.category = selectedCategory;

      const data = await apiClient.getLeads(params);
      setLeads(data.data);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleDragStart = (lead: Lead) => {
    setDraggedLead(lead);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (stage: string) => {
    if (!draggedLead || draggedLead.stage === stage) {
      setDraggedLead(null);
      return;
    }

    // Optimistic update
    setLeads((prev) =>
      prev.map((l) => (l.id === draggedLead.id ? { ...l, stage } : l))
    );

    try {
      await apiClient.changeLeadStage(draggedLead.id, stage);
    } catch (error) {
      console.error('Failed to update lead stage:', error);
      fetchLeads(); // Revert on error
    }

    setDraggedLead(null);
  };

  const getLeadsByStage = (stage: string) => {
    return leads.filter((lead) => lead.stage === stage);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-gray-400 mt-1">{leads.length} total leads</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search leads..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-accent w-full sm:w-64"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
        >
          <option value="">All Categories</option>
          <option value="STARTUP">Startup</option>
          <option value="RESTAURANT">Restaurant</option>
          <option value="HOTEL">Hotel</option>
          <option value="ECOMMERCE">E-commerce</option>
          <option value="SALON">Salon</option>
          <option value="CLINIC">Clinic</option>
          <option value="GYM">Gym</option>
          <option value="RETAIL">Retail</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      {/* Kanban Board */}
      {viewMode === 'kanban' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {STAGES.map((stage) => (
              <div
                key={stage}
                className="w-72 flex-shrink-0"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(stage)}
              >
                <div
                  className={`rounded-t-lg px-4 py-3 ${STAGE_COLORS[stage].bg} border-b ${STAGE_COLORS[stage].border}`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className={`font-medium ${STAGE_COLORS[stage].text}`}>
                      {stage.replace('_', ' ')}
                    </h3>
                    <span className="text-xs bg-gray-800 px-2 py-0.5 rounded-full text-gray-400">
                      {getLeadsByStage(stage).length}
                    </span>
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-b-lg p-2 min-h-[400px] border border-gray-700 border-t-0">
                  <div className="space-y-2">
                    {getLeadsByStage(stage).map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        onDragStart={() => handleDragStart(lead)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Business
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Stage
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Category
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-4">
                    <Link
                      href={`/admin/leads/${lead.id}`}
                      className="font-medium text-white hover:text-accent transition-colors"
                    >
                      {lead.businessName}
                    </Link>
                    {lead.city && (
                      <p className="text-sm text-gray-400">{lead.city}</p>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {lead.contactPerson && (
                      <p className="text-sm text-white">{lead.contactPerson}</p>
                    )}
                    {lead.email && (
                      <p className="text-sm text-gray-400">{lead.email}</p>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${STAGE_COLORS[lead.stage].bg} ${STAGE_COLORS[lead.stage].text}`}
                    >
                      {lead.stage}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full"
                          style={{ width: `${lead.score}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-400">{lead.score}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-400">{lead.category}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function LeadCard({
  lead,
  onDragStart,
}: {
  lead: Lead;
  onDragStart: () => void;
}) {
  return (
    <Link
      href={`/admin/leads/${lead.id}`}
      draggable
      onDragStart={onDragStart}
      className="block bg-gray-800 rounded-lg p-3 border border-gray-700 hover:border-gray-600 cursor-grab active:cursor-grabbing transition-colors"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-medium text-white text-sm leading-tight">
          {lead.businessName}
        </h4>
        <div
          className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_COLORS[lead.priority]}`}
          title={lead.priority}
        />
      </div>

      {lead.city && (
        <p className="text-xs text-gray-400 mb-2">{lead.city}</p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {!lead.hasWebsite && (
            <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
              No site
            </span>
          )}
          {lead.tags.slice(0, 2).map((tag) => (
            <span
              key={tag.id}
              className="px-1.5 py-0.5 text-xs rounded"
              style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
            >
              {tag.name}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <ScoreIcon className="w-3 h-3" />
          {lead.score}
        </div>
      </div>
    </Link>
  );
}

function ScoreIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}
