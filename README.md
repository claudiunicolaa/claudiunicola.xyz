# claudiunicola.xyz

[![Netlify Status](https://api.netlify.com/api/v1/badges/b77be5a1-d3d5-4cc9-b65d-7535c4a7bd80/deploy-status)](https://app.netlify.com/sites/affectionate-knuth-e1e325/deploys)

Personal website and blog, built with [Astro](https://astro.build/).

### Prerequisites
```
node >= 18
npm
```

### Development
```
npm install
npm run dev
```

### Build
```
npm run build
npm run preview   # preview locally
```

### Deploy
Push to `master` — GitHub Actions builds and deploys to GitHub Pages automatically.

### Resume
Edit `resume.json` — the homepage renders it directly (no external tools needed).

### Blog
Add markdown files to `src/content/posts/`. Frontmatter: `title`, `date`, `summary`, `tags`.
