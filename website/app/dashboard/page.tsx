"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { StatCard } from "@/components/dashboard";
import { apiClient } from "@/lib/api-client";

interface DashboardStats {
  citiesMapped: number;
  curatedPlaces: number;
  itineraries: number;
  creditsUsedThisMonth: number;
}

export default function DashboardHomePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const statsData = await apiClient.getDashboardStats();

        setStats({
          citiesMapped: statsData.citiesMapped || 0,
          curatedPlaces: statsData.curatedPlaces || 0,
          itineraries: statsData.itineraries || 0,
          creditsUsedThisMonth: statsData.creditsUsedThisMonth || 0,
        });
      } catch {
        // Handle error silently, show empty state
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Dashboard</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Welcome back! Here&apos;s your Paper Maps overview.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Cities Mapped"
          value={stats?.citiesMapped || 0}
          icon={<MapPinIcon />}
          color="default"
        />
        <StatCard
          label="Curated Places"
          value={stats?.curatedPlaces || 0}
          icon={<SparklesIcon />}
          color="blue"
        />
        <StatCard
          label="Itineraries"
          value={stats?.itineraries || 0}
          icon={<MapIcon />}
          color="orange"
        />
        <StatCard
          label="Credits This Month"
          value={stats?.creditsUsedThisMonth || 0}
          icon={<CalendarIcon />}
          color="green"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-4">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Quick Actions Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="border border-gray-800 rounded-lg bg-gray-900 p-4"
          >
            <h2 className="text-sm font-medium text-white mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              <Link
                href="/explore"
                className="group p-3 bg-gray-800/50 rounded-md hover:bg-accent/10 hover:border-accent/30 border border-gray-800 transition-all"
              >
                <div className="w-8 h-8 rounded-md bg-accent/10 flex items-center justify-center mb-2 group-hover:bg-accent/20 transition-colors">
                  <MapIcon className="w-4 h-4 text-accent" />
                </div>
                <p className="text-[13px] font-medium text-white">Explore Cities</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Browse curated maps</p>
              </Link>

              <Link
                href="/dashboard/settings"
                className="group p-3 bg-gray-800/50 rounded-md hover:bg-blue-500/10 hover:border-blue-500/30 border border-gray-800 transition-all"
              >
                <div className="w-8 h-8 rounded-md bg-blue-500/10 flex items-center justify-center mb-2 group-hover:bg-blue-500/20 transition-colors">
                  <SettingsIcon className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-[13px] font-medium text-white">Settings</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Manage your profile</p>
              </Link>

              <Link
                href="/dashboard/settings/credits"
                className="group p-3 bg-gray-800/50 rounded-md hover:bg-emerald-500/10 hover:border-emerald-500/30 border border-gray-800 transition-all"
              >
                <div className="w-8 h-8 rounded-md bg-emerald-500/10 flex items-center justify-center mb-2 group-hover:bg-emerald-500/20 transition-colors">
                  <CoinIcon className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-[13px] font-medium text-white">Credits</p>
                <p className="text-[11px] text-gray-500 mt-0.5">View balance</p>
              </Link>
            </div>
          </motion.div>

          {/* Placeholder: Recent Cities */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="border border-gray-800 rounded-lg bg-gray-900"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-800/50">
              <h2 className="text-sm font-medium text-white">Recent Cities</h2>
              <Link
                href="/explore"
                className="text-[13px] text-accent hover:text-[#FF8C40] transition-colors"
              >
                View all
              </Link>
            </div>

            <div className="text-center py-8 px-4">
              <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center mx-auto mb-2">
                <MapPinIcon className="w-5 h-5 text-gray-500" />
              </div>
              <p className="text-[13px] text-gray-400">No cities explored yet</p>
              <Link
                href="/explore"
                className="text-[13px] text-accent hover:text-[#FF8C40] mt-1 inline-block"
              >
                Explore a city
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Getting Started Guide */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="border border-accent/30 rounded-lg bg-gradient-to-br from-accent/10 to-accent/5 p-4"
          >
            <h2 className="text-sm font-medium text-white mb-3">Getting Started</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[11px] text-accent font-semibold">1</span>
                </div>
                <div>
                  <p className="text-[13px] font-medium text-white">Pick a City</p>
                  <p className="text-[11px] text-gray-400">Browse available city maps</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[11px] text-accent font-semibold">2</span>
                </div>
                <div>
                  <p className="text-[13px] font-medium text-white">Explore the Map</p>
                  <p className="text-[11px] text-gray-400">Discover curated places and routes</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[11px] text-accent font-semibold">3</span>
                </div>
                <div>
                  <p className="text-[13px] font-medium text-white">Travel Like a Local</p>
                  <p className="text-[11px] text-gray-400">Follow itineraries and discover hidden gems</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tips Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="border border-gray-800 rounded-lg bg-gray-900 p-4"
          >
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Tip</h3>
            <p className="text-[13px] text-gray-300">
              Each city map is hand-curated by locals who know the best spots. Explore one today!
            </p>
            <Link
              href="/explore"
              className="inline-flex items-center gap-1 text-[13px] text-accent hover:text-[#FF8C40] mt-2 transition-colors"
            >
              Browse cities
              <ArrowIcon className="w-3.5 h-3.5" />
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function MapPinIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function SparklesIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function CalendarIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function MapIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  );
}

function SettingsIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function CoinIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
