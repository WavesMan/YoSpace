import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PostImage from './PostImage';

vi.mock('next/image', () => ({ default: React.forwardRef<HTMLImageElement, React.ImgHTMLAttributes<HTMLImageElement>>(function MockImage(props, ref) {
    return <img {...props} ref={ref} />;
}) }));
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('文章图片渐入', () => {
    it('同时等待视口进入与图片解码，并保留原生懒加载', async () => {
        let notify: IntersectionObserverCallback;
        const observer = { observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn() };
        vi.stubGlobal('IntersectionObserver', class {
            constructor(callback: IntersectionObserverCallback) { notify = callback; }
            observe = observer.observe; unobserve = observer.unobserve; disconnect = observer.disconnect;
        });
        render(<PostImage src="/example.png" alt="正文图片" width={700} height={400} loading="lazy" />);
        const image = screen.getByAltText('正文图片');
        let resolveDecode!: () => void;
        Object.defineProperty(image, 'decode', { configurable: true, value: () => new Promise<void>(resolve => { resolveDecode = resolve; }) });
        fireEvent.load(image);
        act(() => { notify!([{ target: image, isIntersecting: true } as unknown as IntersectionObserverEntry], observer as unknown as IntersectionObserver); });
        expect(image).toHaveAttribute('data-image-state', 'pending');
        await act(async () => resolveDecode());
        expect(image).toHaveAttribute('data-image-state', 'entering');
        expect(image).toHaveAttribute('loading', 'lazy');
    });

    it('已缓存图片无需再次触发 load 事件也能正常呈现', async () => {
        vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true);
        vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(700);
        render(<PostImage src="/cached.png" alt="缓存图片" width={700} height={400} />);
        await waitFor(() => expect(screen.getByAltText('缓存图片')).toHaveAttribute('data-image-state', 'entering'));
    });

    it('减少动态效果时完成图片状态，不依赖动画结束事件', async () => {
        vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
        render(<PostImage src="/still.png" alt="静态呈现" width={700} height={400} />);
        fireEvent.load(screen.getByAltText('静态呈现'));
        await waitFor(() => expect(screen.getByAltText('静态呈现')).toHaveAttribute('data-image-state', 'done'));
    });

    it('解码取消或加载失败时不会永久隐藏图片和替代文字', async () => {
        render(<PostImage src="/example.png" alt="失败回退" width={700} height={400} />);
        const image = screen.getByAltText('失败回退');
        Object.defineProperty(image, 'decode', { configurable: true, value: () => Promise.reject(new Error('解码取消')) });
        fireEvent.load(image);
        await waitFor(() => expect(image).toHaveAttribute('data-image-state', 'entering'));
        fireEvent.error(image);
        expect(image).toHaveAttribute('data-image-state', 'error');
    });

    it('更换图片地址时重新等待新图，保留转发 ref 与事件', async () => {
        const ref = React.createRef<HTMLImageElement>();
        const loaded = vi.fn();
        const { rerender } = render(<PostImage ref={ref} src="/first.png" alt="切换图片" width={700} height={400} onLoad={loaded} />);
        const image = screen.getByAltText('切换图片');
        fireEvent.load(image);
        await waitFor(() => expect(image).toHaveAttribute('data-image-state', 'entering'));
        rerender(<PostImage ref={ref} src="/second.png" alt="切换图片" width={700} height={400} onLoad={loaded} />);
        expect(image).toHaveAttribute('data-image-state', 'pending');
        expect(ref.current).toBe(image);
        expect(loaded).toHaveBeenCalledTimes(1);
    });
});
