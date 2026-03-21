import type { Root, Element } from 'hast';
import { visit } from 'unist-util-visit';

export default function rehypeCodeLanguage() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'pre') return;

      const code = node.children.find(
        (child): child is Element =>
          child.type === 'element' && child.tagName === 'code',
      );
      if (!code) return;

      const className = Array.isArray(code.properties?.className)
        ? code.properties.className
        : [];
      const langClass = className.find(
        (c) => typeof c === 'string' && c.startsWith('language-'),
      );
      if (!langClass || typeof langClass !== 'string') return;

      const lang = langClass.replace('language-', '');
      node.properties = node.properties || {};
      node.properties['dataLanguage'] = lang;
    });
  };
}
