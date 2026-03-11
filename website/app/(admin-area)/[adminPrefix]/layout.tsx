"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useParams, notFound } from "next/navigation";
import Link from "next/link";
import { Toaster } from "sonner";
import { useAuth, AuthProvider } from "@/lib/auth";
import { isValidAdminPrefix, getAdminPrefix } from "@/lib/admin-config";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  imageUrl?: string;
}

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const { user: authUser, loading: authLoading, logout, token } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Get the admin prefix from the URL params
  const adminPrefix = params.adminPrefix as string;

  // Base path for all admin routes using the current prefix
  const adminBasePath = `/${adminPrefix}`;

  // Don't check auth on login and status pages
  const isLoginPage = pathname === `${adminBasePath}/login`;
  const isStatusPage = pathname === `${adminBasePath}/status`;
  const skipAuth = isLoginPage || isStatusPage;

  useEffect(() => {
    if (skipAuth || authLoading) return;

    // Not authenticated - redirect to login
    if (!authUser && !authLoading) {
      router.push(`${adminBasePath}/login`);
    }
  }, [authUser, authLoading, skipAuth, router, adminBasePath]);

  // SECURITY: Block entire admin portal for non-ADMIN users (return 404 to hide existence)
  useEffect(() => {
    if (!authLoading && authUser && authUser.role !== 'ADMIN' && !skipAuth) {
      router.replace('/404');
    }
  }, [authLoading, authUser, skipAuth, router]);

  const handleLogout = () => {
    logout();
    router.push(`${adminBasePath}/login`);
  };

  // Show login page without layout
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Show status page with minimal layout (no auth required)
  if (isStatusPage) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-6 lg:p-8">{children}</div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!authUser) {
    return null;
  }

  // SECURITY: Block rendering for non-admin users
  if (authUser.role !== 'ADMIN' && !skipAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  // Navigation items using dynamic admin prefix
  const navItems = [
    { href: adminBasePath, label: "Dashboard", icon: DashboardIcon },
    { href: `${adminBasePath}/cities`, label: "Cities", icon: CitiesIcon },
    { href: `${adminBasePath}/categories`, label: "Categories", icon: CategoriesIcon },
    { href: `${adminBasePath}/tags`, label: "Tags", icon: TagsIcon },
    { href: `${adminBasePath}/users`, label: "Users", icon: UsersIcon },
    { href: `${adminBasePath}/analytics`, label: "Analytics", icon: AnalyticsIcon },
    { href: `${adminBasePath}/coupons`, label: "Coupons", icon: CouponsIcon },
    { href: `${adminBasePath}/api-logs`, label: "API Logs", icon: ApiLogsIcon },
    { href: `${adminBasePath}/settings`, label: "Settings", icon: SettingsIcon },
    { href: `${adminBasePath}/status`, label: "System Status", icon: StatusIcon },
  ];

  // Detect if viewing a city (URL contains /cities/<id>/...)
  const cityMatch = pathname.match(new RegExp(`^${adminBasePath}/cities/([^/]+)(/|$)`));
  const viewingCityId = cityMatch ? cityMatch[1] : null;
  const isOnCitySubpage = viewingCityId && viewingCityId !== "new";

  const citySubNavItems = isOnCitySubpage
    ? [
        { href: `${adminBasePath}/cities/${viewingCityId}`, label: "Overview" },
        { href: `${adminBasePath}/cities/${viewingCityId}/theme`, label: "Theme" },
        { href: `${adminBasePath}/cities/${viewingCityId}/pois`, label: "POIs" },
        { href: `${adminBasePath}/cities/${viewingCityId}/review`, label: "Review Queue" },
        { href: `${adminBasePath}/cities/${viewingCityId}/itineraries`, label: "Itineraries" },
        { href: `${adminBasePath}/cities/${viewingCityId}/collections`, label: "Collections" },
        { href: `${adminBasePath}/cities/${viewingCityId}/discover`, label: "AI Discovery" },
      ]
    : [];

  return (
    <div className="min-h-screen bg-background">
      <Toaster
        position="top-right"
        theme="dark"
        toastOptions={{
          style: {
            background: "#1f2937",
            border: "1px solid #374151",
            color: "#f3f4f6",
          },
        }}
      />
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-gray-400 hover:text-white"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <span className="font-semibold text-accent">Local Guide</span>
        <div className="w-8" />
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-gray-800 border-r border-gray-700 z-50 transform transition-transform duration-200 ease-out lg:translate-x-0 flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-lg font-semibold">
            <span className="text-accent">[</span>
            Local Guide
            <span className="text-accent">]</span>
            <span className="text-gray-400 ml-2 text-sm font-normal">Admin</span>
          </h1>
        </div>

        <nav className="p-3 space-y-0.5 overflow-y-auto flex-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== adminBasePath && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-accent/10 text-accent"
                    : "text-gray-400 hover:text-white hover:bg-gray-700"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}

          {/* City sub-navigation when viewing a city */}
          {citySubNavItems.length > 0 && (
            <>
              <div className="pt-3 mt-3 border-t border-gray-700">
                <div className="px-3 py-1.5 text-xs font-medium text-gray-500 uppercase">
                  City
                </div>
              </div>
              {citySubNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] transition-colors ${
                      isActive
                        ? "bg-accent/10 text-accent"
                        : "text-gray-400 hover:text-white hover:bg-gray-700"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-700">
          <div className="flex items-center gap-2 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm font-medium">
              {authUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-white truncate">
                {authUser.name}
              </p>
              <p className="text-[11px] text-gray-400 truncate">
                {authUser.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors text-left"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <div className="p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const adminPrefix = params.adminPrefix as string;

  // Validate the admin prefix - if invalid, show 404
  if (!isValidAdminPrefix(adminPrefix)) {
    notFound();
  }

  return (
    <AuthProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AuthProvider>
  );
}

function DashboardIcon({ className }: { className?: string }) {
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
        strokeWidth={1.5}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  );
}

function CitiesIcon({ className }: { className?: string }) {
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
        strokeWidth={1.5}
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
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
        strokeWidth={1.5}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function StatusIcon({ className }: { className?: string }) {
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
        strokeWidth={1.5}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function ApiLogsIcon({ className }: { className?: string }) {
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
        strokeWidth={1.5}
        d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
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
        strokeWidth={1.5}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

function AnalyticsIcon({ className }: { className?: string }) {
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
        strokeWidth={1.5}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  );
}

function CategoriesIcon({ className }: { className?: string }) {
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
        strokeWidth={1.5}
        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
      />
    </svg>
  );
}

function TagsIcon({ className }: { className?: string }) {
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
        strokeWidth={1.5}
        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
      />
    </svg>
  );
}

function CouponsIcon({ className }: { className?: string }) {
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
        strokeWidth={1.5}
        d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
      />
    </svg>
  );
}
