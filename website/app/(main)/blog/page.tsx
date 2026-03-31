import Link from "next/link";
import Image from "next/image";
import { getAllPosts } from "@/lib/blog";
import type { Metadata } from "next";

// ============================================================================
// Metadata
// ============================================================================

export const metadata: Metadata = {
  title: "Blog | Paper Maps",
  description:
    "Stories about curated travel, city culture, and the philosophy behind Paper Maps.",
};

// ============================================================================
// Constants
// ============================================================================

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "philosophy", label: "Philosophy" },
  { key: "city-stories", label: "City Stories" },
  { key: "guides", label: "Guides" },
] as const;

// ============================================================================
// Helper
// ============================================================================

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ============================================================================
// Page
// ============================================================================

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const activeCategory = params.category ?? "all";
  const allPosts = getAllPosts();

  const filteredPosts =
    activeCategory === "all"
      ? allPosts
      : allPosts.filter(
          (p) => p.category.toLowerCase() === activeCategory.toLowerCase(),
        );

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Hero */}
      <section className="relative pt-28 pb-12 lg:pt-36 lg:pb-16 overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-30" />

        <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-10">
          <span className="badge mb-4 inline-flex">Journal</span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
            Blog
          </h1>
          <p className="text-lg text-[var(--gray-400)] max-w-xl leading-relaxed">
            Stories about curated travel, city culture, and why we believe fewer
            pins make better maps.
          </p>
        </div>
      </section>

      {/* Category Filters */}
      <section className="border-b border-[var(--gray-800)]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <nav className="flex items-center gap-1 -mb-px overflow-x-auto scrollbar-hide">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.key;
              return (
                <Link
                  key={cat.key}
                  href={
                    cat.key === "all" ? "/blog" : `/blog?category=${cat.key}`
                  }
                  className={[
                    "px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                    isActive
                      ? "border-[var(--accent)] text-white"
                      : "border-transparent text-[var(--gray-400)] hover:text-white hover:border-[var(--gray-600)]",
                  ].join(" ")}
                >
                  {cat.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="py-12 lg:py-16">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--gray-800)] flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-[var(--gray-500)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
                No posts yet
              </h2>
              <p className="text-[var(--gray-400)]">
                We&apos;re writing our first stories. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group block rounded-xl overflow-hidden border border-[var(--gray-700)] bg-[var(--gray-850)] transition-all duration-200 hover:-translate-y-1 hover:border-[var(--gray-600)]"
                >
                  {/* Cover Image */}
                  <div className="aspect-[16/10] bg-[var(--gray-800)] relative overflow-hidden">
                    {post.coverImage ? (
                      <Image
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-5xl font-bold text-[var(--gray-600)] opacity-40">
                          {post.title.charAt(0)}
                        </span>
                      </div>
                    )}

                    {/* Category Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="inline-block px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider bg-[var(--gray-900)]/80 backdrop-blur-sm text-[var(--accent)] rounded-full border border-[var(--gray-700)]">
                        {post.category}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <time className="text-xs text-[var(--gray-500)] mb-2 block">
                      {formatDate(post.date)}
                    </time>
                    <h2 className="text-lg font-semibold text-white mb-2 group-hover:text-[var(--accent)] transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    <p className="text-sm text-[var(--gray-400)] line-clamp-3 leading-relaxed">
                      {post.description}
                    </p>

                    {/* Author */}
                    <div className="mt-4 pt-4 border-t border-[var(--gray-700)] flex items-center justify-between">
                      <span className="text-xs text-[var(--gray-500)]">
                        by {post.author}
                      </span>
                      <span className="text-xs text-[var(--accent)] font-medium group-hover:underline underline-offset-2">
                        Read more
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
