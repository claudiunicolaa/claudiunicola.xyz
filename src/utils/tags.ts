export function tagSlug(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export interface TagInfo {
  name: string;
  slug: string;
  count: number;
  posts: Array<{ slug: string; title: string; date: Date; summary: string }>;
}

export function buildTagMap(
  posts: Array<{ id: string; data: { title: string; date: Date; summary: string; tags: string[] } }>,
): TagInfo[] {
  const tagMap = new Map<string, TagInfo['posts']>();

  for (const post of posts) {
    for (const rawTag of post.data.tags) {
      const tag = rawTag.trim().toLowerCase();
      if (!tag) continue;
      if (!tagMap.has(tag)) tagMap.set(tag, []);
      tagMap.get(tag)!.push({
        slug: post.id,
        title: post.data.title,
        date: post.data.date,
        summary: post.data.summary,
      });
    }
  }

  for (const tagPosts of tagMap.values()) {
    tagPosts.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  return [...tagMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, posts]) => ({
      name,
      slug: tagSlug(name),
      count: posts.length,
      posts,
    }));
}
