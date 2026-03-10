export default function CityPage({
  params,
}: {
  params: { citySlug: string };
}) {
  return (
    <div>
      <h1 className="text-3xl font-bold capitalize">{params.citySlug}</h1>
      <p className="mt-2 text-gray-600">
        Explore the best of {params.citySlug}. Curated by locals, for
        everyone.
      </p>
    </div>
  );
}
