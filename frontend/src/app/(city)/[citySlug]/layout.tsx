export default function CityLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { citySlug: string };
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b px-6 py-4">
        <nav className="mx-auto flex max-w-7xl items-center justify-between">
          <a href="/" className="text-xl font-bold">
            Local Guide
          </a>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium capitalize">
            {params.citySlug}
          </span>
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
