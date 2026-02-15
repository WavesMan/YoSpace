import React from 'react';

export interface TocItem {
    id: string;
    text: string;
    level: number;
}

export const slugifyHeading = (value: string) => {
    return value
        .trim()
        .toLowerCase()
        .replace(/[`~!@#$%^&*()\-=+\[\]{}|;:'",.<>/?\\]/g, '')
        .replace(/\s+/g, '-');
};

export const extractTocFromMarkdown = (markdown: string): TocItem[] => {
    const lines = markdown.split('\n');
    const items: TocItem[] = [];
    let inFence = false;
    let fenceMarker: '```' | '~~~' | null = null;

    for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
            if (!inFence) {
                inFence = true;
                fenceMarker = trimmed.startsWith('```') ? '```' : '~~~';
            } else if (fenceMarker && trimmed.startsWith(fenceMarker)) {
                inFence = false;
                fenceMarker = null;
            }
            continue;
        }

        if (inFence) {
            continue;
        }

        const match = /^(#{1,6})\s+(.+)$/.exec(trimmed);
        if (!match) continue;
        const level = match[1].length;
        if (level > 3) continue;
        const text = match[2].trim();
        const id = slugifyHeading(text);
        if (!id) continue;
        items.push({ id, text, level });
    }
    return items;
};

export const transformTabsSyntax = (markdown: string): string => {
    const lines = markdown.split('\n');
    const result: string[] = [];
    let index = 0;

    const stripIndent = (blockLines: string[]): string[] => {
        let minIndent: number | null = null;
        blockLines.forEach((line) => {
            if (!line.trim()) return;
            const match = /^(\s+)/.exec(line);
            if (!match) {
                minIndent = 0;
                return;
            }
            const indent = match[1].length;
            if (minIndent === null || indent < minIndent) {
                minIndent = indent;
            }
        });
        if (minIndent === null || minIndent <= 0) {
            return blockLines;
        }
        const indentSize = minIndent;
        const indentString = ' '.repeat(indentSize);
        return blockLines.map((line) => {
            if (line.startsWith(indentString)) {
                return line.slice(indentSize);
            }
            return line;
        });
    };

    while (index < lines.length) {
        const line = lines[index];
        const tabMatch = /^===\s+"([^"]+)"\s*$/.exec(line.trim());

        if (!tabMatch) {
            result.push(line);
            index += 1;
            continue;
        }

        const tabs: { label: string; content: string[] }[] = [];

        while (index < lines.length) {
            const headerLine = lines[index];
            const headerMatch = /^===\s+"([^"]+)"\s*$/.exec(headerLine.trim());
            if (!headerMatch) {
                break;
            }
            const label = headerMatch[1];
            index += 1;

            if (index < lines.length && !lines[index].trim()) {
                index += 1;
            }

            const contentLines: string[] = [];
            while (index < lines.length) {
                const current = lines[index];
                const nextHeaderMatch = /^===\s+"([^"]+)"\s*$/.exec(current.trim());
                if (nextHeaderMatch) {
                    break;
                }
                contentLines.push(current);
                index += 1;
            }

            const normalizedContent = stripIndent(contentLines);
            tabs.push({ label, content: normalizedContent });

            if (index >= lines.length) {
                break;
            }
            const nextLine = lines[index];
            if (!/^===\s+"([^"]+)"\s*$/.test(nextLine.trim())) {
                break;
            }
        }

        if (tabs.length === 0) {
            result.push(line);
            continue;
        }

        result.push('<tabs>');
        tabs.forEach((tab) => {
            const escapedLabel = tab.label.replace(/"/g, '&quot;');
            result.push(`<tab label="${escapedLabel}">`);
            result.push('');
            result.push(...tab.content);
            result.push('');
            result.push('</tab>');
        });
        result.push('</tabs>');
    }

    return result.join('\n');
};

export const isVercelButtonSrc = (src: string) => {
    return src.includes('vercel.com/button');
};

export const hasVercelButtonChild = (children: React.ReactNode) => {
    return React.Children.toArray(children).some((child) => {
        if (!React.isValidElement(child)) return false;
        const src = (child.props as { src?: unknown })?.src;
        return typeof src === 'string' && isVercelButtonSrc(src);
    });
};

export const transformMarkdownUrl = (url: string) => {
    const input = url.trim();
    if (!input) return input;
    if (/^javascript:/i.test(input)) return '';

    if (input.startsWith('#')) {
        return input;
    }

    if (input.startsWith('/')) {
        return encodeURI(input);
    }

    try {
        const parsed = new URL(input);

        if (parsed.searchParams.has('repository-url')) {
            const repositoryUrl = parsed.searchParams.get('repository-url') || '';
            parsed.searchParams.set('repository-url', repositoryUrl);
        }

        return parsed.toString();
    } catch {
        return encodeURI(input);
    }
};

export const isOptimizableMarkdownImageSrc = (src: string) => {
    const value = src.trim().toLowerCase();
    if (!value) return false;
    if (value.startsWith('data:')) return false;
    if (value.endsWith('.ico')) return false;
    return true;
};
