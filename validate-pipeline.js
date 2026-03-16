#!/usr/bin/env node
/**
 * validate-pipeline.js
 * End-to-end validation: verifies each _posts/*.md produces a posts/<slug>/index.html
 * with frontmatter values accessible via data attributes and manifest.json.
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const postsDir = path.join(ROOT, '_posts');
const outDir = path.join(ROOT, 'posts');

const mdFiles = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));
const manifest = JSON.parse(fs.readFileSync(path.join(outDir, 'manifest.json'), 'utf-8'));

let allPassed = true;

function slugFromFilename(filename) {
  const base = path.basename(filename, '.md');
  const slug = base.replace(/^\d{4}-\d{2}-\d{2}-/, '');
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

for (const file of mdFiles) {
  const slug = slugFromFilename(file);
  const htmlPath = path.join(outDir, slug, 'index.html');

  // Check HTML file exists
  if (!fs.existsSync(htmlPath)) {
    console.error('FAIL: Missing ' + htmlPath);
    allPassed = false;
    continue;
  }

  const html = fs.readFileSync(htmlPath, 'utf-8');

  // Check data attributes present on <article> element
  const checks = [
    ['data-slug=', 'data-slug attribute'],
    ['data-title=', 'data-title attribute'],
    ['data-date=', 'data-date attribute'],
    ['data-tags=', 'data-tags attribute'],
    ['data-summary=', 'data-summary attribute'],
    ['data-keywords=', 'data-keywords attribute'],
    ['data-reading-time=', 'data-reading-time attribute'],
    ['data-canonical-url=', 'data-canonical-url attribute'],
  ];

  for (const [needle, label] of checks) {
    if (!html.includes(needle)) {
      console.error('FAIL: Missing ' + label + ' in ' + htmlPath);
      allPassed = false;
    }
  }

  // Check JSON-LD BlogPosting present
  if (!html.includes('application/ld+json')) {
    console.error('FAIL: Missing JSON-LD in ' + htmlPath);
    allPassed = false;
  }
  if (!html.includes('"BlogPosting"')) {
    console.error('FAIL: JSON-LD missing BlogPosting type in ' + htmlPath);
    allPassed = false;
  }

  // Check standard meta tags
  if (!html.includes('<meta name="description"') && !html.includes("meta name=\"description\"")) {
    console.error('FAIL: Missing description meta tag in ' + htmlPath);
    allPassed = false;
  }
  if (!html.includes('rel="canonical"')) {
    console.error('FAIL: Missing canonical link in ' + htmlPath);
    allPassed = false;
  }

  // Check slug in manifest
  const manifestPost = manifest.posts.find(p => p.slug === slug);
  if (!manifestPost) {
    console.error('FAIL: slug ' + slug + ' missing from manifest.json');
    allPassed = false;
  } else {
    if (!manifestPost.title) { console.error('FAIL: missing title in manifest for ' + slug); allPassed = false; }
    if (!manifestPost.date) { console.error('FAIL: missing date in manifest for ' + slug); allPassed = false; }
    if (!manifestPost.canonicalUrl) { console.error('FAIL: missing canonicalUrl in manifest for ' + slug); allPassed = false; }
    if (!Array.isArray(manifestPost.tags)) { console.error('FAIL: tags not an array in manifest for ' + slug); allPassed = false; }
  }

  console.log('PASS: ' + slug + ' → posts/' + slug + '/index.html (data-attrs, JSON-LD, manifest all present)');
}

console.log('');
console.log('manifest.json contains ' + manifest.posts.length + ' post(s)');
console.log('_posts/ contains ' + mdFiles.length + ' markdown file(s)');
console.log('Mapping complete: ' + (mdFiles.length === manifest.posts.length ? 'YES' : 'NO (count mismatch)'));
console.log('All checks passed: ' + allPassed);
process.exit(allPassed ? 0 : 1);
