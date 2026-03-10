export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-2 text-gray-600">
        Welcome to the Local Guide admin panel.
      </p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Cities", value: "—" },
          { label: "Points of Interest", value: "—" },
          { label: "Users", value: "—" },
          { label: "Pending Reviews", value: "—" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border p-6">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="mt-1 text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
