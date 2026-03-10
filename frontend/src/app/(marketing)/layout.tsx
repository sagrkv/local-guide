export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b px-6 py-4">
        <nav className="mx-auto flex max-w-7xl items-center justify-between">
          <a href="/" className="text-xl font-bold">
            Local Guide
          </a>
          <div className="flex items-center gap-4">
            <a href="/about" className="text-sm text-gray-600 hover:text-gray-900">
              About
            </a>
            <a
              href="/sign-in"
              className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700"
            >
              Sign In
            </a>
          </div>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t px-6 py-8 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Local Guide. All rights reserved.
      </footer>
    </div>
  );
}
