import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BlogPostMarkdown } from './BlogPostMarkdown';

const mermaidMock = vi.hoisted(() => ({
    initialize: vi.fn(),
    render: vi.fn(async (id: string) => ({
        svg: `<svg data-mermaid-id="${id}"><text>diagram</text></svg>`,
    })),
}));

vi.mock('mermaid', () => ({
    default: mermaidMock,
}));

vi.mock('next/image', () => ({
    default: React.forwardRef<
        HTMLImageElement,
        React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean; unoptimized?: boolean }
    >(function MockImage({ priority, unoptimized, alt = '', ...props }, ref) {
        void priority;
        // eslint-disable-next-line @next/next/no-img-element
        return <img ref={ref} alt={alt} data-unoptimized={String(Boolean(unoptimized))} {...props} />;
    }),
}));

describe('BlogPostMarkdown images', () => {
    it('普通正文图片使用原始地址并跳过 Next 图片优化', () => {
        const src = 'https://cloud.waveyo.cn/Cloud/example/blog-image.png';
        render(<BlogPostMarkdown content={`![示例图片](${src})`} locale="zh-CN" />);

        const image = screen.getByRole('button', { name: '查看大图：示例图片' });
        expect(image).toHaveAttribute('src', src);
        expect(image).toHaveAttribute('data-unoptimized', 'true');
        expect(image.getAttribute('src')).not.toContain('/_next/image');
        expect(image.getAttribute('src')).not.toContain('/api/image-proxy');
    });

    it('徽章图片同样保持外部原始地址', () => {
        const src = 'https://img.shields.io/badge/test-test-blue';
        render(<BlogPostMarkdown content={`![测试徽章](${src})`} locale="zh-CN" />);

        const image = screen.getByAltText('测试徽章');
        expect(image).toHaveAttribute('src', src);
        expect(image).toHaveAttribute('data-unoptimized', 'true');
    });
});

describe('BlogPostMarkdown Mermaid', () => {
    it('根据暗色主题初始化 Mermaid 并渲染图表', async () => {
        document.body.setAttribute('data-theme', 'dark');

        render(<BlogPostMarkdown content={'```mermaid\nflowchart LR\n A --> B\n```'} locale="zh-CN" />);

        await waitFor(() => expect(screen.getByRole('img', { name: 'Mermaid diagram' })).toBeInTheDocument());

        expect(mermaidMock.initialize).toHaveBeenCalledWith(expect.objectContaining({
            theme: 'dark',
            themeVariables: expect.objectContaining({
                lineColor: '#f2f2f2',
                nodeTextColor: '#f5f5f5',
            }),
        }));
    });

    it('主题切换时重新渲染 Mermaid', async () => {
        document.body.setAttribute('data-theme', 'light');

        render(<BlogPostMarkdown content={'```mermaid\nflowchart LR\n A --> B\n```'} locale="zh-CN" />);

        await waitFor(() => expect(mermaidMock.initialize).toHaveBeenCalledWith(expect.objectContaining({
            theme: 'default',
        })));

        document.body.setAttribute('data-theme', 'dark');

        await waitFor(() => expect(mermaidMock.initialize).toHaveBeenLastCalledWith(expect.objectContaining({
            theme: 'dark',
        })));
    });

    it('双指触屏缩放不会启动单指拖动', async () => {
        document.body.setAttribute('data-theme', 'light');

        render(<BlogPostMarkdown content={'```mermaid\nflowchart LR\n A --> B\n```'} locale="zh-CN" />);

        const canvas = await screen.findByRole('img', { name: 'Mermaid diagram' });
        const content = canvas.firstElementChild as HTMLElement;

        fireEvent.pointerDown(canvas, { pointerId: 1, pointerType: 'touch', clientX: 100, clientY: 100 });
        fireEvent.pointerDown(canvas, { pointerId: 2, pointerType: 'touch', clientX: 200, clientY: 100 });
        fireEvent.pointerMove(canvas, { pointerId: 2, pointerType: 'touch', clientX: 300, clientY: 100 });

        expect(content.style.transform).toBe('translate(0px, 0px) scale(2)');

        fireEvent.pointerUp(canvas, { pointerId: 2, pointerType: 'touch' });
        fireEvent.pointerMove(canvas, { pointerId: 1, pointerType: 'touch', clientX: 180, clientY: 180 });

        expect(content.style.transform).toBe('translate(0px, 0px) scale(2)');
    });
});
