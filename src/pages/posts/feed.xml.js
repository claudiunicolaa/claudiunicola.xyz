import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = (await getCollection('posts')).sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime(),
  );

  return rss({
    title: 'Claudiu Nicola — Software Engineering Blog',
    description:
      'Articles on backend engineering, Go, cloud-native architecture, microservices, and software craftsmanship by Claudiu Nicola.',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.summary,
      link: `/posts/${post.id}/`,
      categories: post.data.tags,
      author: 'Claudiu Nicola',
    })),
  });
}
