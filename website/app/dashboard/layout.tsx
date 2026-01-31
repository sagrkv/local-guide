"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Toaster } from "sonner";
import { useUser, useAuth } from "@clerk/nextjs";
import { apiClient, setClerkTokenGetter } from "@/lib/api-client";
import { Sidebar, Header } from "@/components/dashboard";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  creditBalance?: number;
  imageUrl?: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user: clerkUser, isLoaded: clerkLoaded, isSignedIn } = useUser();
  const { getToken, signOut } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [creditBalance, setCreditBalance] = useState(0);

  // Set up Clerk token getter for API client
  useEffect(() => {
    if (getToken) {
      setClerkTokenGetter(getToken);
    }
  }, [getToken]);

  // Check authentication on mount
  useEffect(() => {
    // Wait for Clerk to load
    if (!clerkLoaded) {
      return;
    }

    // If not signed in with Clerk, redirect to sign-in
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    const checkAuth = async () => {
      try {
        const data = await apiClient.getCurrentUser();
        setUser(data.user);
        setCreditBalance(data.user.creditBalance ?? 100);
      } catch (error) {
        // If Clerk is signed in but backend user doesn't exist yet,
        // use Clerk data while waiting for webhook
        if (clerkUser) {
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
  }, [router, clerkLoaded, isSignedIn, clerkUser]);

  const handleLogout = async () => {
    localStorage.removeItem("token");
    await signOut();
    router.push("/sign-in");
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return null;
  }

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
      <Header
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        creditBalance={creditBalance}
      />

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        creditBalance={creditBalance}
        onLogout={handleLogout}
      />

      {/* Main content */}
      <main className="lg:ml-64 h-screen pt-16 lg:pt-0 flex flex-col">
        <div className="p-6 lg:p-8 flex-1 flex flex-col min-h-0">{children}</div>
      </main>
    </div>
  );
}
