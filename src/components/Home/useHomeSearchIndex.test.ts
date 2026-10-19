import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useHomeSearchIndex } from "./useHomeSearchIndex";

afterEach(() => vi.restoreAllMocks());
const response = (slug: string) => ({ ok: true, json: async () => ({ items: [{ slug, title: slug }] }) });

describe("首页搜索索引", () => {
    it("进入导航页才请求，返回导航页复用包括空索引在内的缓存", async () => {
        const fetcher = vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: true, json: async () => ({ items: [] }) } as Response);
        const { result, rerender } = renderHook(({ enabled }) => useHomeSearchIndex(enabled, "zh-CN"), { initialProps: { enabled: false } });
        expect(fetcher).not.toHaveBeenCalled();
        rerender({ enabled: true });
        await waitFor(() => expect(result.current.status).toBe("Ready"));
        rerender({ enabled: false });
        rerender({ enabled: true });
        expect(fetcher).toHaveBeenCalledTimes(1);
        expect(result.current.posts).toEqual([]);
    });

    it("切换语言取消旧请求，忽略迟到响应并按语言复用缓存", async () => {
        let finish!: (value: Response) => void;
        const fetcher = vi.spyOn(globalThis, "fetch")
            .mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }))
            .mockResolvedValueOnce(response("en") as Response)
            .mockResolvedValueOnce(response("zh") as Response);
        const { result, rerender } = renderHook(({ locale }) => useHomeSearchIndex(true, locale), { initialProps: { locale: "zh-CN" } });
        const signal = fetcher.mock.calls[0][1]?.signal;
        rerender({ locale: "en" });
        expect(signal?.aborted).toBe(true);
        await waitFor(() => expect(result.current.posts[0]?.slug).toBe("en"));
        await act(async () => { finish(response("迟到数据") as Response); });
        expect(result.current.posts[0]?.slug).toBe("en");
        rerender({ locale: "zh-CN" });
        await waitFor(() => expect(result.current.posts[0]?.slug).toBe("zh"));
        rerender({ locale: "en" });
        expect(result.current.posts[0]?.slug).toBe("en");
        expect(fetcher).toHaveBeenCalledTimes(3);
    });

    it("错误可局部重试且错误响应不会进入缓存", async () => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        const fetcher = vi.spyOn(globalThis, "fetch")
            .mockResolvedValueOnce({ ok: false, status: 503 } as Response)
            .mockResolvedValueOnce(response("恢复") as Response);
        const { result } = renderHook(() => useHomeSearchIndex(true, "zh-CN"));
        await waitFor(() => expect(result.current.status).toBe("Error"));
        act(() => result.current.retry());
        await waitFor(() => expect(result.current.posts[0]?.slug).toBe("恢复"));
        expect(fetcher).toHaveBeenCalledTimes(2);
    });
});
