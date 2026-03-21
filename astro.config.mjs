import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import rehypeCodeLanguage from './src/plugins/rehype-code-language.ts';

export default defineConfig({
  site: 'https://claudiunicola.xyz',
  integrations: [sitemap()],
  markdown: {
    syntaxHighlight: false,
    rehypePlugins: [rehypeCodeLanguage],
  },
});
