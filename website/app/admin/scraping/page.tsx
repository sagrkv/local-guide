'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface ScrapeJob {
  id: string;
  type: string;
  query: string;
  location: string | null;
  category: string | null;
  status: string;
  leadsFound: number;
  leadsCreated: number;
  leadsDuplicate: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  region: { id: string; name: string; cities: string[] } | null;
  createdBy: { id: string; name: string };
}

interface Region {
  id: string;
  name: string;
  cities: string[];
  state: string | null;
  isActive: boolean;
  _count: { scrapeJobs: number };
}

interface ScrapingStats {
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
  leadsFromScraping: number;
  last24h: { jobs: number; leadsCreated: number };
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
  RUNNING: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
  COMPLETED: { bg: 'bg-green-500/10', text: 'text-green-400' },
  FAILED: { bg: 'bg-red-500/10', text: 'text-red-400' },
  CANCELLED: { bg: 'bg-gray-500/10', text: 'text-gray-400' },
};

const CATEGORIES = [
  { value: 'STARTUP', label: 'Startup' },
  { value: 'RESTAURANT', label: 'Restaurant' },
  { value: 'HOTEL', label: 'Hotel' },
  { value: 'ECOMMERCE', label: 'E-commerce' },
  { value: 'SALON', label: 'Salon' },
  { value: 'CLINIC', label: 'Clinic' },
  { value: 'GYM', label: 'Gym' },
  { value: 'RETAIL', label: 'Retail' },
  { value: 'EDUCATION', label: 'Education' },
  { value: 'REAL_ESTATE', label: 'Real Estate' },
  { value: 'AGENCY', label: 'Agency' },
  { value: 'OTHER', label: 'Other' },
];

export default function ScrapingPage() {
  const [jobs, setJobs] = useState<ScrapeJob[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [stats, setStats] = useState<ScrapingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [newJob, setNewJob] = useState({
    type: 'GOOGLE_MAPS',
    query: '',
    location: '',
    category: '',
    regionId: '',
    maxResults: 25,
  });
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    try {
      const [jobsData, regionsData, statsData] = await Promise.all([
        apiClient.getScrapeJobs({ limit: 50 }),
        apiClient.getRegions(),
        apiClient.getScrapingStats(),
      ]);
      setJobs(jobsData.data);
      setRegions(regionsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll for updates every 10 seconds if there are running jobs
    const interval = setInterval(() => {
      if (jobs.some((j) => j.status === 'RUNNING' || j.status === 'PENDING')) {
        fetchData();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [jobs]);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJob.query) return;

    setCreating(true);
    try {
      await apiClient.createScrapeJob({
        type: newJob.type,
        query: newJob.query,
        location: newJob.location || undefined,
        category: newJob.category || undefined,
        regionId: newJob.regionId || undefined,
        maxResults: newJob.maxResults,
      });
      setShowNewJobModal(false);
      setNewJob({
        type: 'GOOGLE_MAPS',
        query: '',
        location: '',
        category: '',
        regionId: '',
        maxResults: 25,
      });
      fetchData();
    } catch (error) {
      console.error('Failed to create job:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleCancelJob = async (jobId: string) => {
    try {
      await apiClient.cancelScrapeJob(jobId);
      fetchData();
    } catch (error) {
      console.error('Failed to cancel job:', error);
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Scraping</h1>
          <p className="text-gray-400 mt-1">Find new leads automatically</p>
        </div>
        <button
          onClick={() => setShowNewJobModal(true)}
          className="px-4 py-2 bg-accent text-background font-medium rounded-lg hover:bg-accent-light transition-colors"
        >
          Start New Scrape
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Jobs"
            value={stats.total}
          />
          <StatCard
            label="Running"
            value={stats.running}
            color="blue"
            pulse={stats.running > 0}
          />
          <StatCard
            label="Leads Created"
            value={stats.leadsFromScraping}
            color="green"
          />
          <StatCard
            label="Last 24h"
            value={stats.last24h.leadsCreated}
            sublabel={`from ${stats.last24h.jobs} jobs`}
          />
        </div>
      )}

      {/* Regions */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Scraping Regions</h2>
          <span className="text-sm text-gray-400">{regions.length} regions configured</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {regions.map((region) => (
            <div
              key={region.id}
              className={`p-4 rounded-lg border ${
                region.isActive
                  ? 'bg-gray-700/50 border-gray-600'
                  : 'bg-gray-800/50 border-gray-700 opacity-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-white text-sm">{region.name}</h3>
                <div
                  className={`w-2 h-2 rounded-full ${
                    region.isActive ? 'bg-green-500' : 'bg-gray-500'
                  }`}
                />
              </div>
              <p className="text-xs text-gray-400">
                {region.cities.slice(0, 3).join(', ')}
                {region.cities.length > 3 && ` +${region.cities.length - 3} more`}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {region._count.scrapeJobs} jobs
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Jobs List */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold">Recent Jobs</h2>
        </div>
        <div className="divide-y divide-gray-700">
          {jobs.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No scrape jobs yet. Start your first scrape!
            </div>
          ) : (
            jobs.map((job) => (
              <div key={job.id} className="p-4 hover:bg-gray-700/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[job.status].bg} ${STATUS_COLORS[job.status].text}`}
                      >
                        {job.status === 'RUNNING' && (
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse mr-1.5" />
                        )}
                        {job.status}
                      </span>
                      <span className="text-sm text-gray-400">{job.type.replace('_', ' ')}</span>
                    </div>
                    <p className="font-medium text-white mt-1">{job.query}</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {job.region?.name || job.location || 'No location'}
                      {job.category && ` • ${job.category}`}
                    </p>
                  </div>
                  <div className="text-right">
                    {job.status === 'COMPLETED' && (
                      <div className="text-sm">
                        <span className="text-green-400">{job.leadsCreated}</span>
                        <span className="text-gray-400"> / {job.leadsFound} leads</span>
                        {job.leadsDuplicate > 0 && (
                          <span className="text-gray-500 text-xs block">
                            {job.leadsDuplicate} duplicates
                          </span>
                        )}
                      </div>
                    )}
                    {(job.status === 'PENDING' || job.status === 'RUNNING') && (
                      <button
                        onClick={() => handleCancelJob(job.id)}
                        className="text-sm text-red-400 hover:text-red-300 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(job.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* New Job Modal */}
      {showNewJobModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg border border-gray-700">
            <h2 className="text-lg font-semibold mb-4">Start New Scrape Job</h2>
            <form onSubmit={handleCreateJob} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Scrape Type
                </label>
                <select
                  value={newJob.type}
                  onChange={(e) => setNewJob({ ...newJob, type: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-accent"
                >
                  <option value="GOOGLE_MAPS">Google Maps</option>
                  <option value="GOOGLE_SEARCH">Google Search</option>
                  <option value="PERPLEXITY">Perplexity AI</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Search Query
                </label>
                <input
                  type="text"
                  value={newJob.query}
                  onChange={(e) => setNewJob({ ...newJob, query: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-accent"
                  placeholder="e.g., restaurants without website"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Region (optional)
                  </label>
                  <select
                    value={newJob.regionId}
                    onChange={(e) => setNewJob({ ...newJob, regionId: e.target.value, location: '' })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-accent"
                  >
                    <option value="">Select region</option>
                    {regions.filter((r) => r.isActive).map((region) => (
                      <option key={region.id} value={region.id}>
                        {region.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Or Location
                  </label>
                  <input
                    type="text"
                    value={newJob.location}
                    onChange={(e) => setNewJob({ ...newJob, location: e.target.value, regionId: '' })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-accent"
                    placeholder="e.g., Bangalore"
                    disabled={!!newJob.regionId}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category (optional)
                  </label>
                  <select
                    value={newJob.category}
                    onChange={(e) => setNewJob({ ...newJob, category: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-accent"
                  >
                    <option value="">Any category</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Max Results
                  </label>
                  <select
                    value={newJob.maxResults}
                    onChange={(e) => setNewJob({ ...newJob, maxResults: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-accent"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              <div className="bg-gray-700/50 rounded-lg p-4">
                <p className="text-sm text-gray-300">
                  <strong>Note:</strong> Scraping jobs run in the background. You can close this page and check back later.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewJobModal(false)}
                  className="flex-1 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2 bg-accent text-background font-medium rounded-lg hover:bg-accent-light transition-colors disabled:opacity-50"
                >
                  {creating ? 'Starting...' : 'Start Scraping'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sublabel,
  color,
  pulse,
}: {
  label: string;
  value: number;
  sublabel?: string;
  color?: 'blue' | 'green';
  pulse?: boolean;
}) {
  const colorClasses = {
    blue: 'text-blue-400',
    green: 'text-green-400',
  };

  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
      <p className="text-sm text-gray-400">{label}</p>
      <div className="flex items-center gap-2 mt-1">
        {pulse && (
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
        )}
        <p className={`text-2xl font-bold ${color ? colorClasses[color] : 'text-white'}`}>
          {value}
        </p>
      </div>
      {sublabel && <p className="text-xs text-gray-500 mt-1">{sublabel}</p>}
    </div>
  );
}
