"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const Footer = dynamic(() => import("@/components/Common/Footer/Footer"), {
  ssr: false,
  loading: () => null,
});

const MusicPlayer = dynamic(() => import("@/components/MusicPlayer/MusicPlayer"), {
  ssr: false,
  loading: () => null,
});

const ClientShell = () => {
  const pathname = usePathname();
  const [isTransitionActive, setIsTransitionActive] = useState(false);
  const [isTransitionVisible, setIsTransitionVisible] = useState(false);
  const pendingCountRef = useRef(0);
  const startTimeRef = useRef(0);
  const minTimerRef = useRef<number | null>(null);
  const maxTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const routeEndTimerRef = useRef<number | null>(null);
  const hasMountedRef = useRef(false);

  useEffect(() => {
    const minDisplayMs = 520;
    const maxDisplayMs = 9000;
    const fadeOutMs = 220;
    /**
     * 清理过渡相关计时器，避免重复隐藏或内存残留。
     *
     * 使用示例：
     * clearTimers();
     *
     * @returns void
     */
    const clearTimers = () => {
      if (minTimerRef.current) {
        window.clearTimeout(minTimerRef.current);
        minTimerRef.current = null;
      }
      if (maxTimerRef.current) {
        window.clearTimeout(maxTimerRef.current);
        maxTimerRef.current = null;
      }
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
    /**
     * 触发过渡页展示并启动最大兜底时间。
     *
     * 使用示例：
     * show();
     *
     * @returns void
     */
    const show = () => {
      startTimeRef.current = Date.now();
      setIsTransitionActive(true);
      setIsTransitionVisible(true);
      clearTimers();
      maxTimerRef.current = window.setTimeout(() => {
        pendingCountRef.current = 0;
        setIsTransitionVisible(false);
        hideTimerRef.current = window.setTimeout(() => {
          setIsTransitionActive(false);
        }, fadeOutMs);
      }, maxDisplayMs);
    };
    /**
     * 按最短展示时长收起过渡页。
     *
     * 使用示例：
     * scheduleHide();
     *
     * @returns void
     */
    const scheduleHide = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, minDisplayMs - elapsed);
      clearTimers();
      if (remaining > 0) {
        minTimerRef.current = window.setTimeout(() => {
          setIsTransitionVisible(false);
          hideTimerRef.current = window.setTimeout(() => {
            setIsTransitionActive(false);
          }, fadeOutMs);
        }, remaining);
        return;
      }
      setIsTransitionVisible(false);
      hideTimerRef.current = window.setTimeout(() => {
        setIsTransitionActive(false);
      }, fadeOutMs);
    };
    /**
     * 处理过渡开启事件，叠加并展示过渡页。
     *
     * 使用示例：
     * window.dispatchEvent(new CustomEvent("app-transition-start"));
     *
     * @returns void
     */
    const handleStart = () => {
      const nextCount = pendingCountRef.current + 1;
      pendingCountRef.current = nextCount;
      if (nextCount === 1) {
        show();
      }
    };
    /**
     * 处理过渡结束事件，归零后收起过渡页。
     *
     * 使用示例：
     * window.dispatchEvent(new CustomEvent("app-transition-end"));
     *
     * @returns void
     */
    const handleEnd = () => {
      pendingCountRef.current = Math.max(0, pendingCountRef.current - 1);
      if (pendingCountRef.current === 0) {
        scheduleHide();
      }
    };

    window.addEventListener("app-transition-start", handleStart);
    window.addEventListener("app-transition-end", handleEnd);
    return () => {
      window.removeEventListener("app-transition-start", handleStart);
      window.removeEventListener("app-transition-end", handleEnd);
      clearTimers();
    };
  }, []);

  useEffect(() => {
    if (!pathname) return;
    /**
     * 首屏刷新时跳过自动过渡，避免加载完成后再次进入遮罩。
     *
     * 使用示例：
     * if (!hasMountedRef.current) return;
     *
     * @returns void
     */
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    /**
     * 路由变化时重置过渡计数，避免历史开始事件导致遮罩无法关闭。
     *
     * 使用示例：
     * pendingCountRef.current = 0;
     *
     * @returns void
     */
    pendingCountRef.current = 0;
    window.dispatchEvent(new CustomEvent("app-transition-start"));
    if (routeEndTimerRef.current) {
      window.clearTimeout(routeEndTimerRef.current);
    }
    routeEndTimerRef.current = window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("app-transition-end"));
    }, 620);
    return () => {
      if (routeEndTimerRef.current) {
        window.clearTimeout(routeEndTimerRef.current);
        routeEndTimerRef.current = null;
      }
    };
  }, [pathname]);

  return (
    <>
      {isTransitionActive && (
        <div
          className={`app_transition ${isTransitionVisible ? "app_transition_visible" : ""}`}
          aria-live="polite"
          aria-busy={isTransitionVisible}
          role="status"
        >
          <div className="app_transition_card">
            <div className="app_transition_spinner" />
            <div className="app_transition_content">
              <div className="app_transition_title">页面正在切换</div>
              <div className="app_transition_text">内容加载完成后自动进入下一页</div>
            </div>
          </div>
        </div>
      )}
      <Footer />
      <MusicPlayer />
    </>
  );
};

export default ClientShell;
