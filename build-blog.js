#!/usr/bin/env node

/**
 * build-blog.js — Static blog builder
 *
 * Converts Markdown files in _posts/ (with YAML frontmatter) to HTML in posts/
 * using pandoc for Markdown→HTML conversion, Handlebars for templating,
 * and generates a blog index page, RSS feed, and sitemap.
 *
 * Usage: node build-blog.js
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const yaml = require("js-yaml");
const Handlebars = require("handlebars");
const RSS = require("rss");

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const BASE_URL = "https://claudiunicola.xyz";
const SITE_TITLE = "Claudiu Nicola — Software Engineering Blog";
const SITE_DESCRIPTION =
  "Articles on backend engineering, Go, cloud-native architecture, microservices, and software craftsmanship by Claudiu Nicola.";
const AUTHOR = "Claudiu Nicola";
const POSTS_DIR = path.join(__dirname, "_posts");
const OUT_DIR = path.join(__dirname, "posts");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse YAML frontmatter delimited by --- from markdown content */
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return { meta: {}, body: content };
  }
  let meta;
  try {
    meta = yaml.load(match[1]) || {};
  } catch {
    meta = {};
  }
  return { meta, body: match[2] };
}

/** Derive a URL-safe slug from the filename (strip date prefix + extension) */
function slugFromFilename(filename) {
  const base = path.basename(filename, ".md");
  // Remove leading YYYY-MM-DD- prefix if present
  const slug = base.replace(/^\d{4}-\d{2}-\d{2}-/, "");
  // Sanitise: lowercase, keep alphanumeric + hyphens
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Convert Markdown string to HTML via pandoc */
function markdownToHtml(markdown) {
  try {
    const html = execSync("pandoc -f markdown -t html5 --syntax-highlighting=none", {
      input: markdown,
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024,
    });
    return html;
  } catch (err) {
    console.error("pandoc conversion failed:", err.message);
    process.exit(1);
  }
}

/** Format a Date as YYYY-MM-DD */
function fmtDate(d) {
  if (!(d instanceof Date) || isNaN(d)) return "";
  return d.toISOString().split("T")[0];
}

/**
 * Build a mapping of unique tags to their associated posts.
 *
 * @param {Array<{slug: string, title: string, date: Date, summary: string, tags: string[], canonicalUrl: string}>} posts
 * @returns {Map<string, Array<{slug: string, title: string, date: Date, summary: string, canonicalUrl: string}>>}
 *   Sorted map (tags alphabetical, posts within each tag sorted newest-first)
 */
function buildTagMap(posts) {
  const tagMap = new Map();

  for (const post of posts) {
    if (!Array.isArray(post.tags)) continue;

    for (const rawTag of post.tags) {
      // Normalise: trim whitespace, lowercase for grouping key
      const tag = String(rawTag).trim().toLowerCase();
      if (!tag) continue;

      if (!tagMap.has(tag)) {
        tagMap.set(tag, []);
      }
      tagMap.get(tag).push({
        slug: post.slug,
        title: post.title,
        date: post.date,
        summary: post.summary,
        canonicalUrl: post.canonicalUrl,
      });
    }
  }

  // Sort posts within each tag by date descending (newest first)
  for (const [, tagPosts] of tagMap) {
    tagPosts.sort((a, b) => (b.date || 0) - (a.date || 0));
  }

  // Return a new Map sorted alphabetically by tag name
  const sorted = new Map(
    [...tagMap.entries()].sort(([a], [b]) => a.localeCompare(b))
  );
  return sorted;
}

/** Format a Date as human-readable string */
function fmtDateHuman(d) {
  if (!(d instanceof Date) || isNaN(d)) return "";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Estimate reading time from markdown/text content.
 * Assumes ~200 words per minute average reading speed.
 * @param {string} text - Raw markdown or plain text
 * @returns {number} Minutes to read (minimum 1)
 */
function estimateReadingTime(text) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

// ---------------------------------------------------------------------------
// Handlebars helpers
// ---------------------------------------------------------------------------
Handlebars.registerHelper("formatDate", (d) => fmtDateHuman(d));
Handlebars.registerHelper("isoDate", (d) =>
  d instanceof Date && !isNaN(d) ? d.toISOString() : ""
);
Handlebars.registerHelper("tagSlugHelper", (tag) =>
  String(tag)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
);
Handlebars.registerHelper("joinTags", (tags) =>
  Array.isArray(tags) ? tags.map((t) => t.name || t).join(", ") : ""
);

// ---------------------------------------------------------------------------
// Templates (loaded from templates/ directory for maintainability)
// ---------------------------------------------------------------------------
const TEMPLATES_DIR = path.join(__dirname, "templates");

const postTemplate = Handlebars.compile(
  fs.readFileSync(path.join(TEMPLATES_DIR, "post.hbs"), "utf-8")
);

const indexTemplate = Handlebars.compile(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Blog — Claudiu Nicola</title>
  <meta name="description" content="{{siteDescription}}">
  <meta name="author" content="{{author}}">
  <meta name="keywords" content="software engineering blog, backend development, Go, Golang, cloud-native, microservices, DevOps">
  <link rel="canonical" href="{{baseUrl}}/posts/">

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="Blog — Claudiu Nicola">
  <meta property="og:description" content="{{siteDescription}}">
  <meta property="og:url" content="{{baseUrl}}/posts/">
  <meta property="og:site_name" content="Claudiu Nicola">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="Blog — Claudiu Nicola">
  <meta name="twitter:description" content="{{siteDescription}}">

  <!-- JSON-LD -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "{{siteTitle}}",
    "description": "{{siteDescription}}",
    "url": "{{baseUrl}}/posts/",
    "author": {
      "@type": "Person",
      "name": "{{author}}",
      "url": "{{baseUrl}}"
    }{{#if allTags}},
    "keywords": "{{joinTags allTags}}"{{/if}}
  }
  </script>

  <link rel="alternate" type="application/rss+xml" title="{{siteTitle}}" href="{{baseUrl}}/posts/feed.xml">
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&family=Open+Sans:wght@400;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="{{baseUrl}}/posts/style.css">
</head>
<body>
  <header class="site-header">
    <div class="site-header-inner">
      <a href="{{baseUrl}}/" class="brand">Claudiu Nicola</a>
      <nav>
        <a href="{{baseUrl}}/">Resume</a>
        <a href="{{baseUrl}}/posts/" aria-current="page">Blog</a>
      </nav>
    </div>
  </header>
  <div class="container">
    <div class="blog-intro">
      <h1>Blog</h1>
      {{#if posts.length}}<span class="post-count-badge">{{posts.length}} article{{#unless singlePost}}s{{/unless}}</span>{{/if}}
    </div>
    <p class="lead">{{siteDescription}}</p>
    {{#if allTags}}
    <section class="tags-section" aria-label="Browse by topic">
      <h2>Topics</h2>
      <ul class="tags-cloud">
        {{#each allTags}}
        <li><a href="{{../baseUrl}}/posts/tags/{{this.slug}}/" class="tag-badge">{{this.name}} <span class="tag-count">({{this.count}})</span></a></li>
        {{/each}}
      </ul>
    </section>
    {{/if}}
    {{#if posts.length}}
    <ul class="post-list">
      {{#each posts}}
      <li>
        <a href="{{../baseUrl}}/posts/{{this.slug}}/">
          <div class="meta">
            <time datetime="{{isoDate this.date}}">{{formatDate this.date}}</time>
            {{#if this.readingTime}}<span class="meta-sep">·</span><span class="reading-time">{{this.readingTime}} min read</span>{{/if}}
            {{#if this.tags}}<span class="meta-sep">·</span><span class="tags">{{#each this.tags}}<a href="{{../../baseUrl}}/posts/tags/{{tagSlugHelper this}}/"><span>{{this}}</span></a>{{/each}}</span>{{/if}}
          </div>
          <h2>{{this.title}}</h2>
          {{#if this.summary}}<p class="summary">{{this.summary}}</p>{{/if}}
        </a>
      </li>
      {{/each}}
    </ul>
    {{else}}
    <p class="empty">No posts yet. Check back soon!</p>
    {{/if}}
    <a href="{{baseUrl}}/posts/feed.xml" class="rss-link">&#128225; RSS Feed</a>
  </div>
  <footer>&copy; {{year}} Claudiu Nicola. All rights reserved.</footer>
</body>
</html>`);

const tagTemplate = Handlebars.compile(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Posts tagged "{{tag}}" — Claudiu Nicola</title>
  <meta name="description" content="Articles tagged with {{tag}} — software engineering, backend development, and more by Claudiu Nicola.">
  <meta name="author" content="{{author}}">
  <meta name="keywords" content="{{tag}}, software engineering, Claudiu Nicola">
  <link rel="canonical" href="{{canonicalUrl}}">

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="Posts tagged &quot;{{tag}}&quot; — Claudiu Nicola">
  <meta property="og:description" content="Articles tagged with {{tag}} — software engineering, backend development, and more by Claudiu Nicola.">
  <meta property="og:url" content="{{canonicalUrl}}">
  <meta property="og:site_name" content="Claudiu Nicola">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="Posts tagged &quot;{{tag}}&quot; — Claudiu Nicola">
  <meta name="twitter:description" content="Articles tagged with {{tag}} — software engineering, backend development, and more by Claudiu Nicola.">

  <!-- JSON-LD -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Posts tagged \\"{{tag}}\\"",
    "description": "Articles tagged with {{tag}} by Claudiu Nicola",
    "url": "{{canonicalUrl}}",
    "author": {
      "@type": "Person",
      "name": "{{author}}",
      "url": "{{baseUrl}}"
    }
  }
  </script>

  <link rel="alternate" type="application/rss+xml" title="{{siteTitle}}" href="{{baseUrl}}/posts/feed.xml">
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&family=Open+Sans:wght@400;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="{{baseUrl}}/posts/style.css">
</head>
<body>
  <header class="site-header">
    <div class="site-header-inner">
      <a href="{{baseUrl}}/" class="brand">Claudiu Nicola</a>
      <nav>
        <a href="{{baseUrl}}/">Resume</a>
        <a href="{{baseUrl}}/posts/" aria-current="page">Blog</a>
      </nav>
    </div>
  </header>
  <div class="container">
    <h1>Posts tagged <span class="tag-label">{{tag}}</span></h1>
    <p class="lead">{{postCount}} article{{#unless singlePost}}s{{/unless}} tagged with "{{tag}}".</p>
    <ul class="post-list">
      {{#each posts}}
      <li>
        <a href="{{../baseUrl}}/posts/{{this.slug}}/">
          <div class="meta">
            <time datetime="{{isoDate this.date}}">{{formatDate this.date}}</time>
          </div>
          <h2>{{this.title}}</h2>
          {{#if this.summary}}<p class="summary">{{this.summary}}</p>{{/if}}
        </a>
      </li>
      {{/each}}
    </ul>
    <a href="{{baseUrl}}/posts/" class="back-link">&larr; Back to all posts</a>
  </div>
  <footer>&copy; {{year}} Claudiu Nicola. All rights reserved.</footer>
</body>
</html>`);

/** Convert a tag name to a URL-safe slug for filenames */
function makeTagSlug(tag) {
  return tag
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  console.log("build-blog: starting...");

  // Ensure _posts exists
  if (!fs.existsSync(POSTS_DIR)) {
    console.log("build-blog: _posts/ not found — creating empty directory");
    fs.mkdirSync(POSTS_DIR, { recursive: true });
  }

  // Ensure output dir
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Collect markdown files
  const mdFiles = fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .reverse(); // newest first by filename date prefix

  console.log(`build-blog: found ${mdFiles.length} post(s) in _posts/`);

  const posts = [];

  for (const file of mdFiles) {
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf-8");
    const { meta, body } = parseFrontmatter(raw);

    // Derive values with safe defaults
    const slug = slugFromFilename(file);
    const title = meta.title || slug.replace(/-/g, " ");
    const date = meta.date ? new Date(meta.date) : new Date();
    const summary = meta.summary || "";
    const tags = Array.isArray(meta.tags) ? meta.tags : [];
    const keywords = Array.isArray(meta.keywords)
      ? meta.keywords.join(", ")
      : typeof meta.keywords === "string"
        ? meta.keywords
        : "";
    const og_image = meta.og_image || "";
    const readingTime = estimateReadingTime(body);

    // Convert markdown body to HTML via pandoc
    const htmlContent = markdownToHtml(body);

    const canonicalUrl = `${BASE_URL}/posts/${slug}/`;

    // Render post page
    const postHtml = postTemplate({
      title,
      date,
      summary,
      tags,
      keywords,
      og_image,
      readingTime,
      content: htmlContent,
      canonicalUrl,
      baseUrl: BASE_URL,
      author: AUTHOR,
      year: new Date().getFullYear(),
    });

    // Write to posts/<slug>/index.html for clean URLs
    const postDir = path.join(OUT_DIR, slug);
    fs.mkdirSync(postDir, { recursive: true });
    fs.writeFileSync(path.join(postDir, "index.html"), postHtml, "utf-8");
    console.log(`  → posts/${slug}/index.html`);

    posts.push({ slug, title, date, summary, tags, keywords, og_image, readingTime, canonicalUrl });
  }

  // ---- Tag map ----
  const tagMap = buildTagMap(posts);
  console.log(`build-blog: found ${tagMap.size} unique tag(s): ${[...tagMap.keys()].join(", ")}`);

  // ---- Tag pages ----
  const tagsDir = path.join(OUT_DIR, "tags");
  fs.mkdirSync(tagsDir, { recursive: true });

  const tagPageUrls = []; // for sitemap

  for (const [tag, tagPosts] of tagMap) {
    const slug = makeTagSlug(tag);
    if (!slug) continue; // skip empty slugs

    const tagCanonicalUrl = `${BASE_URL}/posts/tags/${slug}/`;
    const tagPageDir = path.join(tagsDir, slug);
    fs.mkdirSync(tagPageDir, { recursive: true });

    const html = tagTemplate({
      tag,
      tagSlug: slug,
      posts: tagPosts,
      postCount: tagPosts.length,
      singlePost: tagPosts.length === 1,
      canonicalUrl: tagCanonicalUrl,
      baseUrl: BASE_URL,
      siteTitle: SITE_TITLE,
      author: AUTHOR,
      year: new Date().getFullYear(),
    });

    fs.writeFileSync(path.join(tagPageDir, "index.html"), html, "utf-8");
    console.log(`  → posts/tags/${slug}/index.html (${tagPosts.length} post(s))`);

    tagPageUrls.push({ loc: tagCanonicalUrl, priority: "0.5" });
  }

  // ---- Blog index page ----
  // Build allTags array from tagMap for the index template
  const allTags = [...tagMap.entries()].map(([name, tagPosts]) => ({
    name,
    slug: makeTagSlug(name),
    count: tagPosts.length,
  }));

  const indexHtml = indexTemplate({
    posts,
    allTags,
    singlePost: posts.length === 1,
    baseUrl: BASE_URL,
    siteTitle: SITE_TITLE,
    siteDescription: SITE_DESCRIPTION,
    author: AUTHOR,
    year: new Date().getFullYear(),
  });
  fs.writeFileSync(path.join(OUT_DIR, "index.html"), indexHtml, "utf-8");
  console.log("  → posts/index.html");

  // ---- RSS Feed ----
  const feed = new RSS({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    feed_url: `${BASE_URL}/posts/feed.xml`,
    site_url: BASE_URL,
    language: "en",
    pubDate: posts.length > 0 ? posts[0].date : new Date(),
  });

  for (const post of posts) {
    feed.item({
      title: post.title,
      description: post.summary,
      url: post.canonicalUrl,
      date: post.date,
      categories: post.tags,
      author: AUTHOR,
    });
  }

  fs.writeFileSync(path.join(OUT_DIR, "feed.xml"), feed.xml({ indent: true }), "utf-8");
  console.log("  → posts/feed.xml");

  // ---- Sitemap ----
  const sitemapUrls = [
    { loc: `${BASE_URL}/`, priority: "1.0" },
    { loc: `${BASE_URL}/posts/`, priority: "0.9" },
    ...posts.map((p) => ({
      loc: p.canonicalUrl,
      lastmod: fmtDate(p.date),
      priority: "0.8",
    })),
    ...tagPageUrls,
  ];

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ""}
    <priority>${u.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  fs.writeFileSync(path.join(__dirname, "sitemap.xml"), sitemapXml, "utf-8");
  console.log("  → sitemap.xml");

  console.log(`build-blog: done — ${posts.length} post(s) generated`);
}

main();
