"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useParams, notFound } from "next/navigation";
import Link from "next/link";
import { Toaster } from "sonner";
import { useUser, useAuth, UserButton, SignOutButton } from "@clerk/nextjs";
import { apiClient, setClerkTokenGetter } from "@/lib/api-client";
import { isValidAdminPrefix, getAdminPrefix } from "@/lib/admin-config";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  imageUrl?: string;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const { user: clerkUser, isLoaded: clerkLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Get the admin prefix from the URL params
  const adminPrefix = params.adminPrefix as string;

  // Validate the admin prefix - if invalid, show 404
  // SECURITY: This prevents access via guessed/invalid admin URLs
  if (!isValidAdminPrefix(adminPrefix)) {
    notFound();
  }

  // Base path for all admin routes using the current prefix
  const adminBasePath = `/${adminPrefix}`;

  // Don't check auth on login and status pages
  const isLoginPage = pathname === `${adminBasePath}/login`;
  const isStatusPage = pathname === `${adminBasePath}/status`;
  const skipAuth = isLoginPage || isStatusPage;

  // Set up Clerk token getter for API client
  useEffect(() => {
    if (getToken) {
      setClerkTokenGetter(getToken);
    }
  }, [getToken]);

  useEffect(() => {
    if (skipAuth) {
      setLoading(false);
      return;
    }

    // Wait for Clerk to load
    if (!clerkLoaded) {
      return;
    }

    // If using Clerk and not signed in, redirect to sign-in
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    const checkAuth = async () => {
      try {
        const data = await apiClient.getCurrentUser();
        setUser(data.user);
      } catch (error) {
        // If Clerk is signed in but backend user doesn't exist yet,
        // show a loading state while webhook creates the user
        if (clerkUser) {
          // Set a basic user from Clerk data while waiting
          setUser({
            id: "",
            name: clerkUser.fullName ?? clerkUser.firstName ?? "User",
            email: clerkUser.primaryEmailAddress?.emailAddress ?? "",
            role: "USER",
            imageUrl: clerkUser.imageUrl,
          });
        } else {
          router.push("/sign-in");
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, skipAuth, clerkLoaded, isSignedIn, clerkUser]);

  // SECURITY: Block entire admin portal for non-ADMIN users (return 404 to hide existence)
  // Only login and status pages are accessible without authentication
  useEffect(() => {
    if (!loading && user && user.role !== 'ADMIN' && !skipAuth) {
      // Use notFound() equivalent - redirect to 404 page to hide admin panel existence
      router.replace('/404');
    }
  }, [loading, user, skipAuth, router]);

  const handleLogout = () => {
    // Clear legacy token
    localStorage.removeItem("token");
    // Clerk's SignOutButton handles Clerk sign out
    router.push("/sign-in");
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // SECURITY: Block rendering for non-admin users - entire admin portal requires ADMIN role
  // Redirect to 404 happens via useEffect above, this prevents flash of content
  if (user.role !== 'ADMIN' && !skipAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  // Navigation items using dynamic admin prefix
  // SECURITY: All admin routes require ADMIN role - no conditional logic needed
  const navItems = [
    { href: adminBasePath, label: "Dashboard", icon: DashboardIcon },
    { href: `${adminBasePath}/users`, label: "Users", icon: UsersIcon },
    { href: `${adminBasePath}/analytics`, label: "Analytics", icon: AnalyticsIcon },
    { href: `${adminBasePath}/coupons`, label: "Coupons", icon: CouponsIcon },
    { href: `${adminBasePath}/jobs`, label: "Job Monitor", icon: ScrapingIcon },
    { href: `${adminBasePath}/api-logs`, label: "API Logs", icon: ApiLogsIcon },
    { href: `${adminBasePath}/regions`, label: "Regions", icon: RegionsIcon },
    { href: `${adminBasePath}/settings`, label: "Settings", icon: SettingsIcon },
    { href: `${adminBasePath}/status`, label: "System Status", icon: StatusIcon },
  ];

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
        <span className="font-semibold text-accent">Boko</span>
        <div className="w-8" />
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-gray-800 border-r border-gray-700 z-50 transform transition-transform duration-200 ease-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-lg font-semibold">
            <span className="text-accent">[</span>
            Boko
            <span className="text-accent">]</span>
            <span className="text-gray-400 ml-2 text-sm font-normal">Admin</span>
          </h1>
        </div>

        <nav className="p-3 space-y-0.5">
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
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-700">
          <div className="flex items-center gap-2 mb-3 px-2">
            {clerkUser ? (
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8",
                    userButtonPopoverCard: "bg-gray-800 border-gray-700",
                    userButtonPopoverActionButton: "text-gray-300 hover:bg-gray-700",
                    userButtonPopoverActionButtonText: "text-gray-300",
                    userButtonPopoverFooter: "hidden",
                  },
                }}
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm font-medium">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-white truncate">
                {clerkUser?.fullName ?? user.name}
              </p>
              <p className="text-[11px] text-gray-400 truncate">
                {clerkUser?.primaryEmailAddress?.emailAddress ?? user.email}
              </p>
            </div>
          </div>
          {clerkUser ? (
            <SignOutButton>
              <button className="w-full px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors text-left">
                Sign out
              </button>
            </SignOutButton>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors text-left"
            >
              Sign out
            </button>
          )}
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

function ScrapingIcon({ className }: { className?: string }) {
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
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
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

function RegionsIcon({ className }: { className?: string }) {
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
        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
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
