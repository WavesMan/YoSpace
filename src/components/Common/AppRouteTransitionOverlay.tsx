"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import AppTransitionView from "@/components/Common/AppTransitionView";

/**
 * 路由切换过渡遮罩组件
 *
 * 仅在 pathname 变化时显示全屏过渡层，首屏渲染不触发。
 *
 * @returns 过渡遮罩节点
 */
function AppRouteTransitionOverlay() {
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
     * 清理过渡相关计时器
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
     * 显示过渡层并开启最大时长兜底
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
     * 以最短展示时长规则隐藏过渡层
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
     * 处理过渡开始事件
     */
    const handleStart = () => {
      const nextCount = pendingCountRef.current + 1;
      pendingCountRef.current = nextCount;
      if (nextCount === 1) {
        show();
      }
    };

    /**
     * 处理过渡结束事件
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
    if (!pathname) {
      return;
    }

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

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

  if (!isTransitionActive) {
    return null;
  }

  return <AppTransitionView className={`app_transition ${isTransitionVisible ? "app_transition_visible" : ""}`} busy={isTransitionVisible} />;
}

export default AppRouteTransitionOverlay;
