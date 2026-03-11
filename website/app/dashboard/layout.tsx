"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Toaster } from "sonner";
import { apiClient } from "@/lib/api-client";
import { Sidebar, Header } from "@/components/dashboard";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  imageUrl?: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem("lg_token");
    if (!token) {
      router.push("/sign-in");
      setLoading(false);
      return;
    }

    const checkAuth = async () => {
      try {
        const data = await apiClient.getCurrentUser();
        setUser(data.user);
      } catch (error) {
        router.push("/sign-in");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("lg_token");
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
      />

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main content */}
      <main className="lg:ml-64 h-screen pt-16 lg:pt-0 flex flex-col">
        <div className="p-6 lg:p-8 flex-1 flex flex-col min-h-0">{children}</div>
      </main>
    </div>
  );
}
