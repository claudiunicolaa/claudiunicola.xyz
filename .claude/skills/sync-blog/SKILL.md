---
name: sync-blog
description: >
  Import an article from an external platform (Medium, dev.to, LinkedIn, Substack,
  personal blog, etc.) into this blog project. Invoke when the user provides a URL
  to an article they want to add to claudiunicola.xyz — e.g. "/sync-blog https://...",
  "import this post", "add this article to my blog", "sync post from medium".
  Always use this skill when the user pastes an article URL alongside a sync/import request.
---

# sync-blog

Import an article from an external URL and convert it into a `_posts/` markdown file
matching the blog's format.

## Blog post format

Every post lives in `_posts/YYYY-MM-DD-slug.md`. The frontmatter fields are:

```yaml
---
title: "Post Title"
date: YYYY-MM-DD            # publication date of the original article
summary: "One sentence describing the post. Used in listings and meta tags."
tags:
  - tag1                    # lowercase, hyphenated (e.g. golang, cloud-native)
  - tag2
keywords:
  - keyword phrase 1        # SEO keyword phrases
  - keyword phrase 2
og_image: "https://claudiunicola.xyz/profile.jpg"   # default; change if article has a header image
---

Article body in Markdown.
```

Required: `title`, `date`. Everything else is optional but strongly recommended.

## Workflow

### 1. Fetch the article

Use `WebFetch` with the provided URL. If the direct fetch fails or returns a login wall,
try fetching a reader-mode or cached version (e.g. `https://webcache.googleusercontent.com/search?q=cache:<url>`).

For LinkedIn articles, content may be behind auth — do your best with what's accessible,
and note any gaps to the user.

### 2. Extract content

From the raw page, extract:

- **Title** — the article's `<h1>` or `<title>` tag, cleaned up
- **Date** — publication date (check `<time>`, meta tags, byline). If not found, use today's date.
- **Author** — note it but don't include in frontmatter (this is a personal blog)
- **Body** — the main article text. Strip navigation, comments, related articles, footers, CTAs.
- **Tags** — infer 2–5 lowercase hyphenated tags from the topic (e.g. `golang`, `devops`, `software-architecture`). Prefer tags already used in this project when appropriate.
- **Summary** — write a single sentence summarising the article's core insight (50–120 chars).
- **Keywords** — 3–5 SEO keyword phrases the article would rank for.

### 3. Convert body to Markdown

Convert HTML body to clean Markdown:
- Headings → `##`, `###` (never `#` — the title is the h1)
- Code blocks → fenced with language identifier when detectable
- Bold/italic preserved
- Images: include as `![alt](url)` — use the original URLs
- Remove social sharing widgets, "clap" buttons, author bios, newsletter CTAs, ads

### 4. Generate the filename and slug

```
slug = title → lowercase → replace spaces/special chars with hyphens → collapse multiple hyphens → trim hyphens
filename = YYYY-MM-DD-{slug}.md   (use the article's publication date for YYYY-MM-DD)
```

Example: "Building a REST API in Go" published 2025-06-15 → `2025-06-15-building-a-rest-api-in-go.md`

### 5. Write the file

Write to `_posts/{filename}`. Show the user the frontmatter before writing and ask for
confirmation if anything looks uncertain (e.g. date couldn't be determined, tags are guesses).

### 6. Offer to build

After writing, ask the user: "Run `npm run build` to regenerate the site?"
If yes, run `npm run build` from the project root and report success/errors.

## Platform-specific notes

| Platform | Where to find content |
|---|---|
| **Medium** | `article` element; date in byline or `<time>` |
| **dev.to** | `article#article-body`; date in `<time>` |
| **LinkedIn** | Articles at `/pulse/`; may require auth — extract what's visible |
| **Substack** | `.body.markup` or `.post-content`; date in post meta |
| **Hashnode** | Main `article` element |
| **Personal blogs** | Use best judgement from the page structure |

## Quality bar

The output `.md` file should be publishable as-is. That means:
- Clean markdown with no HTML artifacts
- Frontmatter fully populated (estimate rather than leave blank)
- Summary is written in your own words — not copy-pasted from the original
- Tags are relevant and consistent with the blog's existing tag vocabulary
