import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getPostBySlug, getPostSlugs, getAllPosts, markdownToHtml } from "@/lib/blog";
import type { Metadata } from "next";

// ============================================================================
// Static Params
// ============================================================================

export function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }));
}

// ============================================================================
// Metadata
// ============================================================================

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Post Not Found | Paper Maps" };

  return {
    title: `${post.title} | Paper Maps Blog`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      ...(post.coverImage ? { images: [post.coverImage] } : {}),
    },
  };
}

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

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const contentHtml = markdownToHtml(post.content);

  // Related posts: same category, different slug
  const relatedPosts = getAllPosts()
    .filter(
      (p) =>
        p.slug !== post.slug &&
        p.category.toLowerCase() === post.category.toLowerCase(),
    )
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Hero */}
      <section className="relative pt-28 pb-0 lg:pt-36 overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-20" />

        <div className="relative z-10 max-w-3xl mx-auto px-6 lg:px-10">
          {/* Back Link */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--gray-400)] hover:text-white transition-colors mb-8"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            All posts
          </Link>

          {/* Category & Date */}
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-block px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider bg-[rgba(255,107,0,0.1)] text-[var(--accent)] rounded-full border border-[rgba(255,107,0,0.3)]">
              {post.category}
            </span>
            <time className="text-sm text-[var(--gray-500)]">
              {formatDate(post.date)}
            </time>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4 leading-tight">
            {post.title}
          </h1>

          {/* Description */}
          <p className="text-lg text-[var(--gray-400)] leading-relaxed mb-6">
            {post.description}
          </p>

          {/* Author */}
          <div className="flex items-center gap-3 pb-8 border-b border-[var(--gray-800)]">
            <div className="w-9 h-9 rounded-full bg-[var(--gray-750)] flex items-center justify-center text-sm font-semibold text-[var(--accent)]">
              {post.author.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{post.author}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Cover Image */}
      {post.coverImage && (
        <section className="py-8">
          <div className="max-w-4xl mx-auto px-6 lg:px-10">
            <div className="aspect-[2/1] relative rounded-xl overflow-hidden border border-[var(--gray-700)]">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 896px"
              />
            </div>
          </div>
        </section>
      )}

      {/* Article Body */}
      <section className="py-8 lg:py-12">
        <div className="max-w-3xl mx-auto px-6 lg:px-10">
          <article
            className="blog-prose"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        </div>
      </section>

      {/* City CTA */}
      {post.citySlug && (
        <section className="pb-12">
          <div className="max-w-3xl mx-auto px-6 lg:px-10">
            <Link
              href={`/explore/${post.citySlug}`}
              className="block p-6 rounded-xl border border-[var(--gray-700)] bg-[var(--gray-850)] hover:border-[var(--accent)] transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--gray-500)] mb-1">
                    Explore this city
                  </p>
                  <p className="text-lg font-semibold text-white group-hover:text-[var(--accent)] transition-colors">
                    Open {post.citySlug.charAt(0).toUpperCase() + post.citySlug.slice(1)} on Paper Maps
                  </p>
                </div>
                <svg
                  className="w-5 h-5 text-[var(--gray-500)] group-hover:text-[var(--accent)] transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-12 lg:py-16 border-t border-[var(--gray-800)]">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
            <h2 className="text-2xl font-bold mb-8">More from {post.category}</h2>
            <div className="grid gap-8 sm:grid-cols-2 max-w-3xl">
              {relatedPosts.map((related) => (
                <Link
                  key={related.slug}
                  href={`/blog/${related.slug}`}
                  className="group block rounded-xl overflow-hidden border border-[var(--gray-700)] bg-[var(--gray-850)] transition-all duration-200 hover:-translate-y-1 hover:border-[var(--gray-600)]"
                >
                  {related.coverImage && (
                    <div className="aspect-[16/10] bg-[var(--gray-800)] relative overflow-hidden">
                      <Image
                        src={related.coverImage}
                        alt={related.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, 50vw"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <time className="text-xs text-[var(--gray-500)] mb-2 block">
                      {formatDate(related.date)}
                    </time>
                    <h3 className="text-base font-semibold text-white group-hover:text-[var(--accent)] transition-colors">
                      {related.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
