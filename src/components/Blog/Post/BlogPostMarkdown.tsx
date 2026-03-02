import React, { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
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

interface MermaidBlockProps {
    code: string;
}

const MarkdownTabs: React.FC<MarkdownTabsProps> = ({ children }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const childArray = React.Children.toArray(children)
        .filter(React.isValidElement) as React.ReactElement<{ label?: string; children?: React.ReactNode }>[];
    if (childArray.length === 0) {
        return null;
    }

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

const MermaidBlock: React.FC<MermaidBlockProps> = ({ code }) => {
    const [svg, setSvg] = useState('');
    const [hasError, setHasError] = useState(false);
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [panEnabled, setPanEnabled] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const reactId = useId().replace(/:/g, '');
    const wrapperRef = React.useRef<HTMLDivElement | null>(null);
    const dragStateRef = React.useRef({
        startX: 0,
        startY: 0,
        originX: 0,
        originY: 0,
        pointerId: -1,
    });
    const offsetRef = React.useRef(offset);
    offsetRef.current = offset;

    const clampScale = (value: number) => {
        return Math.min(2.5, Math.max(0.5, value));
    };

    const resetView = () => {
        setScale(1);
        setOffset({ x: 0, y: 0 });
    };

    const toggleFullscreen = async () => {
        const target = wrapperRef.current;
        if (!target) return;
        if (document.fullscreenElement) {
            await document.exitFullscreen();
            return;
        }
        if (target.requestFullscreen) {
            await target.requestFullscreen();
        }
    };

    useEffect(() => {
        let isActive = true;
        const render = async () => {
            try {
                const mermaidModule = await import('mermaid');
                const mermaid = mermaidModule.default ?? mermaidModule;
                mermaid.initialize({
                    startOnLoad: false,
                    securityLevel: 'strict',
                });
                const { svg } = await mermaid.render(`mermaid-${reactId}`, code);
                if (!isActive) return;
                setSvg(svg);
                setHasError(false);
            } catch {
                if (!isActive) return;
                setHasError(true);
            }
        };

        setSvg('');
        setHasError(false);
        render();

        return () => {
            isActive = false;
        };
    }, [code, reactId]);

    useEffect(() => {
        const handleChange = () => {
            const isActive = document.fullscreenElement === wrapperRef.current;
            setIsFullscreen(isActive);
            if (isActive) {
                setPanEnabled(true);
            }
        };
        document.addEventListener('fullscreenchange', handleChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleChange);
        };
    }, []);

    if (hasError || !svg) {
        return <CodeBlock language="mermaid" value={code} />;
    }

    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!panEnabled && !isFullscreen) return;
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        const target = event.currentTarget;
        target.setPointerCapture(event.pointerId);
        dragStateRef.current = {
            startX: event.clientX,
            startY: event.clientY,
            originX: offsetRef.current.x,
            originY: offsetRef.current.y,
            pointerId: event.pointerId,
        };
        setIsDragging(true);
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging) return;
        if (dragStateRef.current.pointerId !== event.pointerId) return;
        const deltaX = event.clientX - dragStateRef.current.startX;
        const deltaY = event.clientY - dragStateRef.current.startY;
        const maxX = isFullscreen ? 80 : 480;
        const maxY = isFullscreen ? 60 : 320;
        const nextX = dragStateRef.current.originX + deltaX;
        const nextY = dragStateRef.current.originY + deltaY;
        setOffset({
            x: Math.max(-maxX, Math.min(maxX, nextX)),
            y: Math.max(-maxY, Math.min(maxY, nextY)),
        });
    };

    const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
        if (dragStateRef.current.pointerId !== event.pointerId) return;
        event.currentTarget.releasePointerCapture(event.pointerId);
        setIsDragging(false);
    };

    const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
        event.preventDefault();
        const step = event.deltaY > 0 ? -0.1 : 0.1;
        setScale(prev => clampScale(prev + step));
    };

    return (
        <div className={`${style.md_mermaid} ${isFullscreen ? style.md_mermaid_fullscreen : ''}`} ref={wrapperRef}>
            <div className={style.md_mermaid_toolbar}>
                <button
                    type="button"
                    className={style.md_mermaid_btn}
                    onClick={() => setScale(prev => clampScale(prev + 0.2))}
                    aria-label="放大"
                >
                    ＋
                </button>
                <button
                    type="button"
                    className={style.md_mermaid_btn}
                    onClick={() => setScale(prev => clampScale(prev - 0.2))}
                    aria-label="缩小"
                >
                    －
                </button>
                <button
                    type="button"
                    className={style.md_mermaid_btn}
                    onClick={resetView}
                    aria-label="重置视图"
                >
                    重置
                </button>
                <button
                    type="button"
                    className={`${style.md_mermaid_btn} ${panEnabled ? style.md_mermaid_btn_active : ''}`}
                    onClick={() => setPanEnabled(prev => !prev)}
                    aria-label="位移"
                >
                    位移
                </button>
                <button
                    type="button"
                    className={style.md_mermaid_btn}
                    onClick={toggleFullscreen}
                    aria-label="全屏"
                >
                    全屏
                </button>
            </div>
            <div
                className={`${style.md_mermaid_canvas} ${panEnabled || isFullscreen ? style.md_mermaid_canvas_pannable : ''} ${isDragging ? style.md_mermaid_canvas_dragging : ''} ${isFullscreen ? style.md_mermaid_canvas_fullscreen : ''}`}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerEnd}
                onPointerCancel={handlePointerEnd}
                onWheel={handleWheel}
                role="img"
                aria-label="Mermaid diagram"
            >
                <div
                    className={style.md_mermaid_content}
                    style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
                    dangerouslySetInnerHTML={{ __html: svg }}
                />
            </div>
            {isFullscreen ? (
                <button
                    type="button"
                    className={style.md_mermaid_close}
                    onClick={toggleFullscreen}
                    aria-label="退出全屏"
                >
                    关闭
                </button>
            ) : null}
        </div>
    );
};

const looksLikeMermaid = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return false;
    return /^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|stateDiagram-v2|erDiagram|journey|gantt|pie|mindmap|timeline|quadrantChart|xychart|requirementDiagram|gitGraph|sankey|block-beta)\b/i.test(trimmed);
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

type MarkdownComponents = Components & {
    tabs?: React.ComponentType<{ children?: React.ReactNode }>;
};

export const BlogPostMarkdown: React.FC<BlogPostMarkdownProps> = ({ content, locale }) => {
    const components: MarkdownComponents = {
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
        img({ src, alt, width, height, title, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { node?: unknown }) {
            const rawSrc = typeof src === 'string' ? src : '';
            const nextSrc = transformMarkdownUrl(rawSrc);
            const nextClassName = [
                props.className,
                nextSrc && isVercelButtonSrc(nextSrc) ? style.vercel_button_img : undefined,
            ].filter(Boolean).join(' ');
            const resolvedWidth = Number(width) || 700;
            const resolvedHeight = Number(height) || 400;

            if (!nextSrc) {
                return null;
            }

            const imageAlt = alt || '';
            const imageProps = {
                src: nextSrc,
                className: nextClassName || undefined,
                width: resolvedWidth,
                height: resolvedHeight,
                loading: 'lazy' as const,
                title,
            };

            if (!isOptimizableMarkdownImageSrc(nextSrc)) {
                return <Image {...imageProps} alt={imageAlt} unoptimized />;
            }

            return <Image {...imageProps} alt={imageAlt} />;
        },
        code({ inline, className, children, ...props }: { inline?: boolean; node?: unknown; className?: string; children?: React.ReactNode } & React.HTMLAttributes<HTMLElement>) {
            const match = /language-([^\s]+)/i.exec(className || '');
            const value = String(children ?? '').replace(/\n$/, '');
            const trimmedValue = value.trim();
            const language = (match?.[1] || '').trim().toLowerCase();
            const isMermaid = !inline && (language === 'mermaid' || (!language && looksLikeMermaid(trimmedValue)));
            if (!match && !isMermaid) {
                return (
                    <code className={className} {...props}>
                        {children}
                    </code>
                );
            }
            if (isMermaid) {
                return <MermaidBlock code={trimmedValue} />;
            }
            return <CodeBlock language={language || 'text'} value={value} />;
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
    };

    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            urlTransform={transformMarkdownUrl}
            components={components}
        >
            {transformTabsSyntax(content)}
        </ReactMarkdown>
    );
};
