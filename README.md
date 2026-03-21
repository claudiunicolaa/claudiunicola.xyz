# claudiunicola.xyz

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
