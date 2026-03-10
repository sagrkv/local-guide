export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-24 text-center">
      <h1 className="text-5xl font-bold tracking-tight">
        Discover Your City Like a Local
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
        Curated guides, hidden gems, and local favorites — all in one place.
        Explore the best your city has to offer.
      </p>
      <div className="mt-10 flex items-center justify-center gap-4">
        <a
          href="/explore/mysore"
          className="rounded-md bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-700"
        >
          Explore Mysore
        </a>
        <a
          href="/about"
          className="rounded-md border px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Learn More
        </a>
      </div>
    </div>
  );
}
