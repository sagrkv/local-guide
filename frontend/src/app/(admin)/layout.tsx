import { UserButton } from "@clerk/nextjs";

const sidebarLinks = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/cities", label: "Cities" },
  { href: "/admin/pois", label: "Points of Interest" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/audit-logs", label: "Audit Logs" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-gray-50">
        <div className="p-6">
          <a href="/admin/dashboard" className="text-lg font-bold">
            Local Guide Admin
          </a>
        </div>
        <nav className="px-4">
          {sidebarLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-200"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Topbar */}
        <header className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">Admin Panel</h2>
          <UserButton afterSignOutUrl="/" />
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
