'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

interface DashboardStats {
  totalLeads: number;
  newLeads: number;
  closedLeads: number;
  leadsThisMonth: number;
  activeScrapeJobs: number;
  averageScore: number;
}

interface PipelineCount {
  stage: string;
  count: number;
}

interface Activity {
  id: string;
  type: string;
  title: string;
  createdAt: string;
  lead: { id: string; businessName: string };
  user: { name: string };
}

const STAGE_COLORS: Record<string, string> = {
  NEW: 'bg-blue-500',
  CONTACTED: 'bg-yellow-500',
  INTERESTED: 'bg-purple-500',
  CLOSED: 'bg-green-500',
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pipeline, setPipeline] = useState<PipelineCount[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, pipelineData, activitiesData] = await Promise.all([
          apiClient.getDashboardStats(),
          apiClient.getPipelineCounts(),
          apiClient.getRecentActivities(),
        ]);
        setStats(statsData);
        setPipeline(pipelineData);
        setActivities(activitiesData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-gray-400 text-sm">Overview of your lead pipeline</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Leads"
          value={stats?.totalLeads || 0}
          icon={<UsersIcon />}
        />
        <StatCard
          label="New Leads"
          value={stats?.newLeads || 0}
          icon={<SparklesIcon />}
          color="blue"
        />
        <StatCard
          label="Closed Deals"
          value={stats?.closedLeads || 0}
          icon={<TrophyIcon />}
          color="green"
        />
        <StatCard
          label="This Month"
          value={stats?.leadsThisMonth || 0}
          icon={<CalendarIcon />}
          color="purple"
        />
      </div>

      {/* Pipeline Overview */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium">Pipeline Overview</h2>
          <Link
            href="/admin/leads"
            className="text-sm text-accent hover:text-accent-light transition-colors"
          >
            View all leads →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {pipeline.map((item) => (
            <div key={item.stage} className="text-center">
              <div
                className={`h-2 rounded-full mb-3 ${STAGE_COLORS[item.stage] || 'bg-gray-600'}`}
              />
              <p className="text-2xl font-bold">{item.count}</p>
              <p className="text-xs text-gray-400 uppercase tracking-wide mt-1">
                {item.stage.replace('_', ' ')}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Activity */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h2 className="text-sm font-medium mb-3">Recent Activity</h2>
          <div className="space-y-3">
            {activities.length === 0 ? (
              <p className="text-gray-400 text-center py-4 text-sm">No recent activity</p>
            ) : (
              activities.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <ActivityIcon type={activity.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-white">{activity.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      <Link
                        href={`/admin/leads/${activity.lead.id}`}
                        className="text-accent hover:text-accent-light"
                      >
                        {activity.lead.businessName}
                      </Link>
                      {' · '}
                      {activity.user.name}
                      {' · '}
                      {formatTimeAgo(activity.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h2 className="text-sm font-medium mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/admin/leads?stage=NEW"
              className="p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <p className="text-sm font-medium">New Leads</p>
              <p className="text-xs text-gray-400 mt-0.5">Review incoming leads</p>
            </Link>
            <Link
              href="/admin/scraping"
              className="p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <p className="text-sm font-medium">Start Scraping</p>
              <p className="text-xs text-gray-400 mt-0.5">Find new businesses</p>
            </Link>
            <Link
              href="/admin/leads"
              className="p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <p className="text-sm font-medium">Kanban Board</p>
              <p className="text-xs text-gray-400 mt-0.5">Manage pipeline</p>
            </Link>
            <Link
              href="/admin/settings"
              className="p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <p className="text-sm font-medium">Settings</p>
              <p className="text-xs text-gray-400 mt-0.5">Configure regions</p>
            </Link>
          </div>

          {stats?.activeScrapeJobs !== undefined && stats.activeScrapeJobs > 0 && (
            <div className="mt-4 p-4 bg-accent/10 border border-accent/20 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <p className="text-sm text-accent">
                  {stats.activeScrapeJobs} scrape job{stats.activeScrapeJobs > 1 ? 's' : ''} running
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'purple';
}) {
  const colorClasses = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    purple: 'text-purple-400',
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-400">{label}</p>
          <p className={`text-2xl font-semibold mt-0.5 ${color ? colorClasses[color] : 'text-white'}`}>
            {value.toLocaleString()}
          </p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center text-gray-400">
          {icon}
        </div>
      </div>
    </div>
  );
}

function ActivityIcon({ type }: { type: string }) {
  switch (type) {
    case 'CALL':
      return <PhoneIcon className="w-4 h-4 text-green-400" />;
    case 'EMAIL':
      return <MailIcon className="w-4 h-4 text-blue-400" />;
    case 'MEETING':
      return <CalendarIcon className="w-4 h-4 text-purple-400" />;
    default:
      return <NoteIcon className="w-4 h-4 text-gray-400" />;
  }
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// Icons
function UsersIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "w-6 h-6"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function NoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}
