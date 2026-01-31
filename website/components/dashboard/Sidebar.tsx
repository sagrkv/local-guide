"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, SignOutButton, useUser } from "@clerk/nextjs";
import CreditBadge from "./CreditBadge";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    name: string;
    email: string;
    imageUrl?: string;
  };
  creditBalance: number;
  onLogout: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: { href: string; label: string }[];
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: HomeIcon },
  { href: "/dashboard/scrape", label: "Scrape", icon: SearchIcon },
  { href: "/dashboard/leads", label: "Leads", icon: UsersIcon },
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: SettingsIcon,
    children: [
      { href: "/dashboard/settings", label: "Profile" },
      { href: "/dashboard/settings/credits", label: "Credits" },
    ],
  },
];

export default function Sidebar({
  isOpen,
  onClose,
  user,
  creditBalance,
  onLogout,
}: SidebarProps) {
  const pathname = usePathname();
  const { user: clerkUser } = useUser();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  const isExactActive = (href: string) => pathname === href;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-gray-800 border-r border-gray-700 z-50
          transform transition-transform duration-200 ease-out
          lg:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-700">
          <Link href="/dashboard" className="block">
            <h1 className="text-xl font-bold">
              <span className="text-accent">[</span>
              Boko
              <span className="text-accent">]</span>
            </h1>
          </Link>
        </div>

        {/* Credit Balance & Theme Toggle */}
        <div className="px-4 py-4 border-b border-gray-700 flex items-center justify-between">
          <CreditBadge balance={creditBalance} size="md" showLabel />
          <ThemeToggle />
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const hasChildren = item.children && item.children.length > 0;
            const showChildren = hasChildren && active;

            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    ${
                      active && !hasChildren
                        ? "bg-accent/10 text-accent"
                        : active && hasChildren
                          ? "text-white"
                          : "text-gray-400 hover:text-white hover:bg-gray-700"
                    }
                  `}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                  {hasChildren && (
                    <ChevronIcon
                      className={`w-4 h-4 ml-auto transition-transform ${
                        showChildren ? "rotate-90" : ""
                      }`}
                    />
                  )}
                </Link>

                {/* Sub-navigation */}
                {showChildren && item.children && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onClose}
                        className={`
                          block px-4 py-2 text-sm rounded-lg transition-colors
                          ${
                            isExactActive(child.href)
                              ? "text-accent bg-accent/10"
                              : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                          }
                        `}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700 bg-gray-800">
          <div className="flex items-center gap-3 mb-4 px-4">
            {clerkUser ? (
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10",
                    userButtonPopoverCard: "bg-gray-800 border-gray-700",
                    userButtonPopoverActionButton: "text-gray-300 hover:bg-gray-700",
                    userButtonPopoverActionButtonText: "text-gray-300",
                    userButtonPopoverFooter: "hidden",
                  },
                }}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-medium">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {clerkUser?.fullName ?? user.name}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {clerkUser?.primaryEmailAddress?.emailAddress ?? user.email}
              </p>
            </div>
          </div>
          {clerkUser ? (
            <SignOutButton>
              <button className="w-full px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors text-left flex items-center gap-2">
                <LogoutIcon className="w-4 h-4" />
                Sign out
              </button>
            </SignOutButton>
          ) : (
            <button
              onClick={onLogout}
              className="w-full px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors text-left flex items-center gap-2"
            >
              <LogoutIcon className="w-4 h-4" />
              Sign out
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

// Icons
function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      />
    </svg>
  );
}
