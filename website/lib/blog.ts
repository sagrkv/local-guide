import fs from 'fs';
import path from 'path';

// ============================================================================
// Blog Post Types
// ============================================================================

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  category: string;
  coverImage?: string;
  citySlug?: string;
  content: string;
}

// ============================================================================
// Frontmatter Parser (no external dependency)
// ============================================================================

interface ParsedFile {
  data: Record<string, string>;
  content: string;
}

function parseFrontmatter(raw: string): ParsedFile {
  const lines = raw.split('\n');
  const data: Record<string, string> = {};

  // File must start with ---
  if (lines[0]?.trim() !== '---') {
    return { data, content: raw };
  }

  let closingIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i]?.trim() === '---') {
      closingIndex = i;
      break;
    }
  }

  if (closingIndex === -1) {
    return { data, content: raw };
  }

  // Parse key: value pairs from frontmatter block
  for (let i = 1; i < closingIndex; i++) {
    const line = lines[i] ?? '';
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();

    // Strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    data[key] = value;
  }

  const content = lines.slice(closingIndex + 1).join('\n').trim();
  return { data, content };
}

// ============================================================================
// Simple Markdown-to-HTML Renderer
// ============================================================================

export function markdownToHtml(md: string): string {
  let html = md;

  // Escape HTML entities in content (but we'll restore our own tags)
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Headers (### before ## before #)
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Links: [text](url)
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
  );

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr />');

  // Blockquotes
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote><p>$1</p></blockquote>');

  // Wrap paragraphs: split on double newlines, wrap non-tag blocks in <p>
  const blocks = html.split(/\n{2,}/);
  html = blocks
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      // Already an HTML block element — leave it alone
      if (/^<(h[1-6]|blockquote|hr|ul|ol|div|pre)/.test(trimmed)) {
        return trimmed;
      }
      return `<p>${trimmed.replace(/\n/g, '<br />')}</p>`;
    })
    .filter(Boolean)
    .join('\n');

  return html;
}

// ============================================================================
// File System Helpers
// ============================================================================

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog');

function ensureBlogDir(): boolean {
  try {
    return fs.existsSync(BLOG_DIR);
  } catch {
    return false;
  }
}

export function getPostSlugs(): string[] {
  if (!ensureBlogDir()) return [];

  try {
    return fs
      .readdirSync(BLOG_DIR)
      .filter((f) => f.endsWith('.mdx') || f.endsWith('.md'))
      .map((f) => f.replace(/\.(mdx|md)$/, ''));
  } catch {
    return [];
  }
}

export function getPostBySlug(slug: string): BlogPost | null {
  if (!ensureBlogDir()) return null;

  const mdxPath = path.join(BLOG_DIR, `${slug}.mdx`);
  const mdPath = path.join(BLOG_DIR, `${slug}.md`);

  let filePath: string | null = null;
  if (fs.existsSync(mdxPath)) {
    filePath = mdxPath;
  } else if (fs.existsSync(mdPath)) {
    filePath = mdPath;
  }

  if (!filePath) return null;

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = parseFrontmatter(raw);

    return {
      slug,
      title: data.title ?? 'Untitled',
      description: data.description ?? '',
      date: data.date ?? '',
      author: data.author ?? '',
      category: data.category ?? 'general',
      coverImage: data.coverImage,
      citySlug: data.citySlug,
      content,
    };
  } catch {
    return null;
  }
}

export function getAllPosts(): BlogPost[] {
  const slugs = getPostSlugs();

  const posts = slugs
    .map((slug) => getPostBySlug(slug))
    .filter((p): p is BlogPost => p !== null);

  // Sort by date descending (newest first)
  return [...posts].sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}
