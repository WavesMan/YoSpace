import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import style from '../BlogPost.module.css';
import CodeBlock from '../CodeBlock';
import {
    slugifyHeading,
    transformTabsSyntax,
    isVercelButtonSrc,
    hasVercelButtonChild,
    transformMarkdownUrl,
    isOptimizableMarkdownImageSrc,
} from './markdownUtils';

interface MarkdownTabsProps {
    children?: React.ReactNode;
}

interface BlogPostMarkdownProps {
    content: string;
    locale: string;
}

const MarkdownTabs: React.FC<MarkdownTabsProps> = ({ children }) => {
    const childArray = React.Children.toArray(children)
        .filter(React.isValidElement) as React.ReactElement<{ label?: string; children?: React.ReactNode }>[];

    if (childArray.length === 0) {
        return null;
    }

    const [activeIndex, setActiveIndex] = useState(0);
    const safeIndex = activeIndex < childArray.length ? activeIndex : 0;
    const activeTab = childArray[safeIndex];

    return (
        <div className={style.md_tabs}>
            <div className={style.md_tabs_headers}>
                {childArray.map((tab, index) => {
                    const label = typeof tab.props.label === 'string' ? tab.props.label : `Tab ${index + 1}`;
                    const isActive = index === safeIndex;
                    return (
                        <button
                            key={`${label}-${index}`}
                            type="button"
                            className={`${style.md_tabs_header} ${isActive ? style.md_tabs_header_active : ''}`}
                            onClick={() => setActiveIndex(index)}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>
            <div className={style.md_tabs_panel}>
                {activeTab.props.children}
            </div>
        </div>
    );
};

const renderHeading = (
    tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6',
    props: React.HTMLAttributes<HTMLHeadingElement> & { children?: React.ReactNode }
) => {
    const Tag = tag;
    const text = React.Children.toArray(props.children)
        .map(child => {
            if (typeof child === 'string') return child;
            if (React.isValidElement(child)) {
                const element = child as React.ReactElement<{ children?: React.ReactNode }>;
                if (typeof element.props.children === 'string') {
                    return element.props.children;
                }
            }
            return '';
        })
        .join('');
    const id = slugifyHeading(text);
    return (
        <Tag id={id} {...props}>
            {props.children}
        </Tag>
    );
};

export const BlogPostMarkdown: React.FC<BlogPostMarkdownProps> = ({ content, locale }) => {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            urlTransform={transformMarkdownUrl}
            components={{
                p({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement> & { node?: unknown }) {
                    if (hasVercelButtonChild(children)) {
                        const items = React.Children.toArray(children);
                        const buttonIndex = items.findIndex((child) => {
                            if (!React.isValidElement(child)) return false;
                            const childProps = child.props as { children?: React.ReactNode };
                            return hasVercelButtonChild(childProps.children);
                        });

                        if (buttonIndex >= 0) {
                            return (
                                <p {...props}>
                                    {items.slice(0, buttonIndex)}
                                    <br />
                                    <span className={style.md_inline_indent}>
                                        {items[buttonIndex]}
                                    </span>
                                    {items.slice(buttonIndex + 1)}
                                </p>
                            );
                        }
                    }

                    return (
                        <p {...props}>
                            {children}
                        </p>
                    );
                },
                a({ href, children, target, rel, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { node?: unknown }) {
                    const nextHref = href || '';
                    if (nextHref.startsWith('/')) {
                        return (
                            <Link href={nextHref} {...props}>
                                {children}
                            </Link>
                        );
                    }

                    const isHttp = nextHref.startsWith('http://') || nextHref.startsWith('https://');
                    const nextTarget = target ?? (isHttp ? '_blank' : undefined);
                    const nextRel = rel ?? (isHttp ? 'noopener noreferrer' : undefined);
                    const nextClassName = [
                        props.className,
                        hasVercelButtonChild(children) ? style.vercel_button_link : undefined,
                    ].filter(Boolean).join(' ');

                    return (
                        <a
                            href={nextHref}
                            target={nextTarget}
                            rel={nextRel}
                            className={nextClassName || undefined}
                            {...props}
                        >
                            {children}
                        </a>
                    );
                },
                img({ src, alt, width, height, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { node?: unknown }) {
                    const rawSrc = typeof src === 'string' ? src : '';
                    const nextSrc = transformMarkdownUrl(rawSrc);
                    const nextClassName = [
                        props.className,
                        nextSrc && isVercelButtonSrc(nextSrc) ? style.vercel_button_img : undefined,
                    ].filter(Boolean).join(' ');

                    if (!isOptimizableMarkdownImageSrc(nextSrc)) {
                        if (!nextSrc) {
                            return null;
                        }
                        return (
                            <img
                                src={nextSrc}
                                alt={alt || ''}
                                className={nextClassName || undefined}
                                {...props}
                            />
                        );
                    }

                    return (
                        <Image
                            src={nextSrc}
                            alt={alt || ''}
                            className={nextClassName || undefined}
                            width={Number(width) || 700}
                            height={Number(height) || 400}
                            loading="lazy"
                            {...props}
                        />
                    );
                },
                code({ className, children, ...props }: { node?: unknown; className?: string; children?: React.ReactNode } & React.HTMLAttributes<HTMLElement>) {
                    const match = /language-(\w+)/.exec(className || '');
                    return match ? (
                        <CodeBlock language={match[1]} value={String(children).replace(/\n$/, '')} />
                    ) : (
                        <code className={className} {...props}>
                            {children}
                        </code>
                    );
                },
                h1(props: React.HTMLAttributes<HTMLHeadingElement> & { children?: React.ReactNode }) {
                    return renderHeading('h1', props);
                },
                h2(props: React.HTMLAttributes<HTMLHeadingElement> & { children?: React.ReactNode }) {
                    return renderHeading('h2', props);
                },
                h3(props: React.HTMLAttributes<HTMLHeadingElement> & { children?: React.ReactNode }) {
                    return renderHeading('h3', props);
                },
                h4(props: React.HTMLAttributes<HTMLHeadingElement> & { children?: React.ReactNode }) {
                    return renderHeading('h4', props);
                },
                h5(props: React.HTMLAttributes<HTMLHeadingElement> & { children?: React.ReactNode }) {
                    return renderHeading('h5', props);
                },
                h6(props: React.HTMLAttributes<HTMLHeadingElement> & { children?: React.ReactNode }) {
                    return renderHeading('h6', props);
                },
                tabs({ children }: { children?: React.ReactNode }) {
                    return <MarkdownTabs>{children}</MarkdownTabs>;
                },
                blockquote({ children, ...props }: React.BlockquoteHTMLAttributes<HTMLQuoteElement> & { node?: unknown }) {
                    const childArray = React.Children.toArray(children);
                    let matchedKind: 'note' | 'tip' | 'warning' | 'important' | 'caution' | undefined;
                    let replaced = false;
                    const markerRegex = /^\s*\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]\s*/i;

                    const mapKind = (raw: string) => {
                        const key = raw.toUpperCase();
                        if (key === 'NOTE') return 'note' as const;
                        if (key === 'TIP') return 'tip' as const;
                        if (key === 'WARNING') return 'warning' as const;
                        if (key === 'IMPORTANT') return 'important' as const;
                        if (key === 'CAUTION') return 'caution' as const;
                        return undefined;
                    };

                    const processNode = (node: React.ReactNode): React.ReactNode => {
                        if (typeof node === 'string') {
                            if (replaced) {
                                return node;
                            }
                            const match = markerRegex.exec(node);
                            if (!match) {
                                return node;
                            }
                            const kind = mapKind(match[1]);
                            if (!kind) {
                                return node;
                            }
                            matchedKind = kind;
                            replaced = true;
                            const next = node.replace(markerRegex, '');
                            return next;
                        }

                        if (React.isValidElement(node)) {
                            const element = node as React.ReactElement<{ children?: React.ReactNode }>;
                            const nextChildren = React.Children.map(element.props.children, processNode);
                            return React.cloneElement(element, element.props, nextChildren);
                        }

                        return node;
                    };

                    const processedChildren = childArray.map(processNode);

                    if (!matchedKind) {
                        return (
                            <blockquote {...props}>
                                {children}
                            </blockquote>
                        );
                    }

                    const labelMap: Record<string, { zh: string; en: string }> = {
                        note: { zh: '说明', en: 'Note' },
                        tip: { zh: '提示', en: 'Tip' },
                        warning: { zh: '警告', en: 'Warning' },
                        important: { zh: '重要', en: 'Important' },
                        caution: { zh: '注意', en: 'Caution' },
                    };

                    const labelConfig = labelMap[matchedKind];
                    const labelText = locale === 'zh-CN' ? labelConfig.zh : labelConfig.en;

                    return (
                        <div className={`${style.md_callout} ${style[`md_callout_${matchedKind}`] || ''}`}>
                            <div className={style.md_callout_label}>{labelText}</div>
                            <div className={style.md_callout_body}>
                                {processedChildren}
                            </div>
                        </div>
                    );
                },
            } as any}
        >
            {transformTabsSyntax(content)}
        </ReactMarkdown>
    );
};
