export default function ExploreCityPage({
  params,
}: {
  params: { citySlug: string };
}) {
  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <h1 className="text-3xl font-bold capitalize">
        Explore {params.citySlug}
      </h1>
      <p className="mt-2 text-gray-600">
        Discover curated guides and hidden gems in {params.citySlug}.
      </p>
    </div>
  );
}
