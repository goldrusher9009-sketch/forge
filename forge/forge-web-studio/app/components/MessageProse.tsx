'use client';

import React from 'react';
import Markdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Root } from 'mdast';
import { useUiLanguage } from '../../lib/ui-language';
import styles from './MessageProse.module.css';

type MarkdownNode = {
  type: string;
  value?: string;
  children?: MarkdownNode[];
  data?: { hName: string; hProperties: Record<string, string> };
};

// Resolve Forge citations only in prose, never inside code or a link destination.
function remarkFileCitations() {
  return (tree: Root) => {
    const visit = (node: MarkdownNode) => {
      if (!node.children || ['link', 'linkReference', 'code', 'inlineCode', 'html'].includes(node.type)) return;
      node.children = node.children.flatMap(child => {
        if (child.type !== 'text' || !child.value) { visit(child); return [child]; }
        const result: MarkdownNode[] = [];
        let cursor = 0;
        for (const match of child.value.matchAll(/\[file:([A-Za-z0-9-]{8,})\]/g)) {
          if (match.index! > cursor) result.push({ type: 'text', value: child.value.slice(cursor, match.index) });
          result.push({ type: 'forgeCitation', data: { hName: 'span', hProperties: { 'data-forge-file': match[1] } }, children: [{ type: 'text', value: match[0] }] });
          cursor = match.index! + match[0].length;
        }
        if (!cursor) return [child];
        if (cursor < child.value.length) result.push({ type: 'text', value: child.value.slice(cursor) });
        return result;
      });
    };
    visit(tree as MarkdownNode);
  };
}

function messageUrl(url: string, key: string): string | undefined {
  if (key === 'src' && /^data:image\/(?:png|jpeg|gif|webp|avif);base64,[a-zA-Z0-9+/=\s]+$/.test(url)) return url;
  try {
    const parsed = new URL(url);
    if (['https:', 'http:'].includes(parsed.protocol) || (key === 'href' && parsed.protocol === 'mailto:')) return url;
  } catch { /* An incomplete streamed URL remains readable until it is complete. */ }
  return undefined;
}

export function MessageProse({ content, fileNames }: { content: string; fileNames: Record<string, string> }) {
  const [language] = useUiLanguage();
  const zh = language === 'zh';
  // Keep renderer identities stable across chat polling and streaming updates so
  // tables retain their scroll position and keyboard focus.
  const components = React.useMemo<Components>(() => ({
      a({ href, title, children }) {
        if (!href) return <span>{children}</span>;
        return <a href={href} target="_blank" rel="noopener noreferrer" title={title || `${href} · ${zh ? '在新标签页打开' : 'Opens in a new tab'}`}>{children}</a>;
      },
      img({ src, alt }) {
        if (!src) return <span>{alt}</span>;
        return <a href={src} target="_blank" rel="noopener noreferrer" aria-label={zh ? `打开图片：${alt || '图片'}` : `Open image: ${alt || 'Image'}`}><img src={src} alt={alt || (zh ? '图片' : 'Image')} loading="lazy" referrerPolicy="no-referrer" /></a>;
      },
      table({ children }) {
        return <div className={styles.tableScroll} role="region" aria-label={zh ? '表格，可横向滚动' : 'Table, scroll horizontally'} tabIndex={0}><table>{children}</table></div>;
      },
      th({ children, style }) { return <th scope="col" style={style}>{children}</th>; },
      span({ node, children }) {
        const id = node?.properties?.['dataForgeFile'] ?? node?.properties?.['data-forge-file'];
        if (typeof id !== 'string') return <span>{children}</span>;
        const name = fileNames[id];
        return <span className={styles.citation} title={name || `${zh ? '资料来源' : 'Library source'} ${id}`}>📄 {name || `${zh ? '来源' : 'Source'} ${id.slice(0, 8)}`}</span>;
      },
  }), [zh, fileNames]);
  return <div className={styles.prose} data-testid="message-prose">
    <Markdown remarkPlugins={[remarkGfm, remarkFileCitations]} skipHtml urlTransform={messageUrl} components={components}>{content}</Markdown>
  </div>;
}
