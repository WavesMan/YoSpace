"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_RUNTIME_PUBLIC_CONFIG,
  normalizeRuntimePublicConfig,
  type RuntimePublicConfig,
} from "@/config/runtimePublicConfig";

const RuntimePublicConfigContext = createContext<RuntimePublicConfig>(DEFAULT_RUNTIME_PUBLIC_CONFIG);

interface RuntimePublicConfigProviderProps {
  initialConfig?: Partial<RuntimePublicConfig>;
  children: React.ReactNode;
}

/**
 * 将配置快照同步到浏览器全局，供非 React 模块读取。
 *
 * @param config 配置对象
 */
function syncConfigToWindow(config: RuntimePublicConfig): void {
  if (typeof window === "undefined") {
    return;
  }
  (window as Window & { __RUNTIME_PUBLIC_CONFIG__?: RuntimePublicConfig }).__RUNTIME_PUBLIC_CONFIG__ = config;
}

/**
 * Runtime Public Config Provider。
 *
 * 客户端首次使用服务端注入值，随后尝试从 API 更新。
 *
 * @param props Provider 参数
 * @returns Provider 节点
 */
export function RuntimePublicConfigProvider({ initialConfig, children }: RuntimePublicConfigProviderProps) {
  const [config, setConfig] = useState<RuntimePublicConfig>(() =>
    normalizeRuntimePublicConfig(initialConfig || DEFAULT_RUNTIME_PUBLIC_CONFIG),
  );

  useEffect(() => {
    syncConfigToWindow(config);
  }, [config]);

  useEffect(() => {
    let aborted = false;
    const load = async () => {
      try {
        const response = await fetch("/api/runtime/public-config", { cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || aborted) {
          return;
        }
        setConfig(normalizeRuntimePublicConfig(data?.config));
      } catch {
      }
    };
    void load();
    return () => {
      aborted = true;
    };
  }, []);

  const contextValue = useMemo(() => config, [config]);
  return (
    <RuntimePublicConfigContext.Provider value={contextValue}>
      {children}
    </RuntimePublicConfigContext.Provider>
  );
}

/**
 * 读取当前 Runtime Public Config。
 *
 * @returns 配置对象
 */
export function useRuntimePublicConfig(): RuntimePublicConfig {
  return useContext(RuntimePublicConfigContext);
}

/**
 * 在非 React 客户端模块中读取配置快照。
 *
 * @returns 配置快照
 */
export function getRuntimePublicConfigSnapshot(): RuntimePublicConfig {
  if (typeof window === "undefined") {
    return DEFAULT_RUNTIME_PUBLIC_CONFIG;
  }
  const runtimeConfig = (window as Window & { __RUNTIME_PUBLIC_CONFIG__?: RuntimePublicConfig }).__RUNTIME_PUBLIC_CONFIG__;
  return runtimeConfig || DEFAULT_RUNTIME_PUBLIC_CONFIG;
}
