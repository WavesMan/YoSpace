'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import styles from './AdminMarkdownPreview.module.css';

interface AdminMarkdownPreviewProps {
  content: string;
}

interface MarkdownTabsProps {
  children?: React.ReactNode;
}

type CalloutKind = 'note' | 'tip' | 'warning' | 'important' | 'caution';

interface AdminCodeBlockProps {
  language: string;
  value: string;
}

interface MermaidBlockProps {
  code: string;
}

/**
 * 判断代码块内容是否为 Mermaid 语法
 *
 * @param value 代码文本
 * @returns 是否为 Mermaid 图定义
 */
function looksLikeMermaid(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }
  return /^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|stateDiagram-v2|erDiagram|journey|gantt|pie|mindmap|timeline|quadrantChart|xychart|requirementDiagram|gitGraph|sankey|block-beta)\b/i.test(trimmed);
}

/**
 * 后台预览代码块组件
 *
 * @param props 代码块参数
 * @returns 代码块节点
 */
function AdminCodeBlock({ language, value }: AdminCodeBlockProps) {
  return (
    <div className={styles.codeWrapper}>
      <div className={styles.codeHeader}>
        <span className={styles.codeLang}>{language || 'text'}</span>
      </div>
      <SyntaxHighlighter
        language={language || 'text'}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          padding: '1.1rem',
          background: 'transparent',
          fontSize: '0.92rem',
          lineHeight: '1.55',
        }}
        showLineNumbers
        wrapLongLines
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
}

/**
 * 后台预览 Mermaid 图组件
 *
 * @param props Mermaid 代码
 * @returns Mermaid 渲染节点
 */
function MermaidBlock({ code }: MermaidBlockProps) {
  const [svg, setSvg] = React.useState('');
  const [hasError, setHasError] = React.useState(false);
  const reactId = React.useId().replace(/:/g, '');

  React.useEffect(() => {
    let active = true;
    const render = async () => {
      try {
        const mermaidModule = await import('mermaid');
        const mermaid = mermaidModule.default ?? mermaidModule;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
        });
        const result = await mermaid.render(`admin-mermaid-${reactId}`, code);
        if (!active) {
          return;
        }
        setSvg(result.svg);
        setHasError(false);
      } catch {
        if (!active) {
          return;
        }
        setHasError(true);
      }
    };

    setSvg('');
    setHasError(false);
    render();

    return () => {
      active = false;
    };
  }, [code, reactId]);

  if (hasError || !svg) {
    return <AdminCodeBlock language="mermaid" value={code} />;
  }

  return (
    <div className={styles.mermaidBlock}>
      <div className={styles.mermaidSvg} dangerouslySetInnerHTML={{ __html: svg }} />
    </div>
  );
}

/**
 * 构建 tabs 中间节点
 *
 * @param tabBlocks tab 数据
 * @returns tabs 中间节点文本
 */
function buildTabsBlock(tabBlocks: Array<{ label: string; content: string[] }>): string {
  const result: string[] = [];
  result.push('<md-tabs>');
  tabBlocks.forEach(tab => {
    result.push(`<md-tab label="${tab.label.replace(/"/g, '&quot;')}">`);
    result.push(tab.content.join('\n'));
    result.push('</md-tab>');
  });
  result.push('</md-tabs>');
  return result.join('\n');
}

/**
 * 转换 :::tabs 语法
 *
 * 与前台文章页保持同一语法约定：
 * :::tabs
 * @tab 标题
 * 内容
 * :::endtab
 * :::endtabs
 *
 * @param markdown 原始 Markdown
 * @returns 转换后的 Markdown
 */
function transformDirectiveTabsSyntax(markdown: string): string {
  const lines = markdown.split('\n');
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const current = lines[i]?.trim() || '';
    if (current !== ':::tabs') {
      result.push(lines[i]);
      i += 1;
      continue;
    }

    const tabBlocks: Array<{ label: string; content: string[] }> = [];
    i += 1;
    while (i < lines.length) {
      const next = lines[i]?.trim() || '';
      if (next === ':::endtabs') {
        i += 1;
        break;
      }
      if (next.startsWith('@tab ')) {
        const label = next.replace('@tab ', '').trim() || 'Tab';
        const block: string[] = [];
        i += 1;
        while (i < lines.length) {
          const inner = lines[i]?.trim() || '';
          if (inner === ':::endtab' || inner.startsWith('@tab ') || inner === ':::endtabs') {
            break;
          }
          block.push(lines[i]);
          i += 1;
        }
        if (i < lines.length && lines[i]?.trim() === ':::endtab') {
          i += 1;
        }
        tabBlocks.push({ label, content: block });
        continue;
      }
      i += 1;
    }

    if (tabBlocks.length > 0) {
      result.push(buildTabsBlock(tabBlocks));
    }
  }

  return result.join('\n');
}

/**
 * 转换 === "Tab" 语法（MkDocs/Material 风格）
 *
 * 示例：
 * === "macOS"
 *     内容
 * === "Windows"
 *     内容
 *
 * @param markdown 原始 Markdown
 * @returns 转换后的 Markdown
 */
function transformEqualsTabsSyntax(markdown: string): string {
  const lines = markdown.split('\n');
  const result: string[] = [];
  const tabTitleRegex = /^===\s+"([^"]+)"\s*$/;
  let i = 0;

  while (i < lines.length) {
    const firstMatch = lines[i]?.match(tabTitleRegex);
    if (!firstMatch) {
      result.push(lines[i]);
      i += 1;
      continue;
    }

    const tabBlocks: Array<{ label: string; content: string[] }> = [];
    while (i < lines.length) {
      const titleMatch = lines[i]?.match(tabTitleRegex);
      if (!titleMatch) {
        break;
      }

      const label = titleMatch[1]?.trim() || 'Tab';
      i += 1;
      const block: string[] = [];

      while (i < lines.length) {
        const next = lines[i] ?? '';
        if (tabTitleRegex.test(next)) {
          break;
        }
        if (next.trim() === '') {
          block.push('');
          i += 1;
          continue;
        }

        if (next.startsWith('    ')) {
          block.push(next.slice(4));
          i += 1;
          continue;
        }
        if (next.startsWith('\t')) {
          block.push(next.slice(1));
          i += 1;
          continue;
        }

        // NOTE: 出现未缩进正文，视为 tabs 结束，交由外层继续处理。
        break;
      }

      tabBlocks.push({ label, content: block });
      if (i < lines.length && !tabTitleRegex.test(lines[i]) && lines[i].trim() !== '') {
        break;
      }
    }

    if (tabBlocks.length > 0) {
      result.push(buildTabsBlock(tabBlocks));
      continue;
    }

    result.push(lines[i] || '');
    i += 1;
  }

  return result.join('\n');
}

/**
 * 统一转换 Tabs 语法
 *
 * @param markdown 原始 Markdown
 * @returns 转换后的 Markdown
 */
function transformTabsSyntax(markdown: string): string {
  const withDirectiveTabs = transformDirectiveTabsSyntax(markdown);
  return transformEqualsTabsSyntax(withDirectiveTabs);
}

/**
 * Markdown Tabs 预览组件
 *
 * @param props tabs 节点参数
 * @returns Tabs 节点
 */
function MarkdownTabs({ children }: MarkdownTabsProps) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const childArray = React.Children.toArray(children)
    .filter(React.isValidElement) as React.ReactElement<{ label?: string; children?: React.ReactNode }>[];
  if (childArray.length === 0) {
    return null;
  }
  const safeIndex = activeIndex < childArray.length ? activeIndex : 0;
  const activeTab = childArray[safeIndex];

  return (
    <div className={styles.mdTabs}>
      <div className={styles.mdTabsHeaders}>
        {childArray.map((tab, index) => {
          const label = typeof tab.props.label === 'string' ? tab.props.label : `Tab ${index + 1}`;
          const active = index === safeIndex;
          return (
            <button
              key={`${label}-${index}`}
              type="button"
              className={`${styles.mdTabsHeader} ${active ? styles.mdTabsHeaderActive : ''}`}
              onClick={() => {
                setActiveIndex(index);
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
      <div className={styles.mdTabsPanel}>{activeTab.props.children}</div>
    </div>
  );
}

/**
 * 后台文章 Markdown 预览组件
 *
 * 使用与前台一致的解析栈（react-markdown + remark-gfm + rehype-raw），
 * 便于在编辑时接近真实展示效果，同时保持后台与前台组件解耦。
 *
 * @param props 组件参数
 * @returns Markdown 渲染节点
 */
function AdminMarkdownPreview({ content }: AdminMarkdownPreviewProps) {
  const source = content.trim();
  if (!source) {
    return <p className={styles.previewEmpty}>暂无内容，开始输入 Markdown 后将在这里实时预览。</p>;
  }

  const components: Components & Record<string, (props: { children?: React.ReactNode }) => React.ReactElement | null> = {
    'md-tabs': ({ children }: { children?: React.ReactNode }) => <MarkdownTabs>{children}</MarkdownTabs>,
    code({ inline, className, children, ...props }: { inline?: boolean; node?: unknown; className?: string; children?: React.ReactNode } & React.HTMLAttributes<HTMLElement>) {
      const match = /language-([^\s]+)/i.exec(className || '');
      const value = String(children ?? '').replace(/\n$/, '');
      const trimmedValue = value.trim();
      const language = (match?.[1] || '').trim().toLowerCase();
      const isMermaid = !inline && (language === 'mermaid' || (!language && looksLikeMermaid(trimmedValue)));

      if (inline) {
        return (
          <code className={className} {...props}>
            {children}
          </code>
        );
      }

      if (isMermaid) {
        return <MermaidBlock code={trimmedValue} />;
      }

      if (!match) {
        return (
          <code className={`${styles.codePlain} ${className || ''}`}>
            {value}
          </code>
        );
      }

      return <AdminCodeBlock language={language} value={value} />;
    },
    blockquote: ({ children, ...props }) => {
      let matchedKind: CalloutKind | null = null;
      const markerRegex = /^\s*\[\!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]\s*/i;

      const processNode = (node: React.ReactNode): React.ReactNode => {
        if (matchedKind) {
          return node;
        }
        if (typeof node === 'string') {
          const match = node.match(markerRegex);
          if (!match) {
            return node;
          }
          const kind = match[1].toLowerCase() as CalloutKind;
          matchedKind = kind;
          return node.replace(markerRegex, '');
        }
        if (React.isValidElement(node)) {
          const element = node as React.ReactElement<{ children?: React.ReactNode }>;
          const nextChildren = React.Children.map(element.props.children, processNode);
          return React.cloneElement(element, element.props, nextChildren);
        }
        return node;
      };

      const processedChildren = React.Children.map(children, processNode);
      if (!matchedKind) {
        return <blockquote {...props}>{children}</blockquote>;
      }
      const labelMap: Record<CalloutKind, string> = {
        note: 'Note',
        tip: 'Tip',
        warning: 'Warning',
        important: 'Important',
        caution: 'Caution',
      };

      return (
        <div
          className={`${styles.mdCallout} ${styles[
            matchedKind === 'note'
              ? 'mdCalloutNote'
              : matchedKind === 'tip'
                ? 'mdCalloutTip'
                : matchedKind === 'warning'
                  ? 'mdCalloutWarning'
                  : matchedKind === 'important'
                    ? 'mdCalloutImportant'
                    : 'mdCalloutCaution'
          ]}`}
        >
          <div className={styles.mdCalloutLabel}>{labelMap[matchedKind]}</div>
          <div className={styles.mdCalloutBody}>{processedChildren}</div>
        </div>
      );
    },
  };

  return (
    <div className={styles.previewContent}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={components}>
        {transformTabsSyntax(source)}
      </ReactMarkdown>
    </div>
  );
}

export default AdminMarkdownPreview;
