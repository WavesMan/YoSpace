import {
  DEFAULT_RUNTIME_PUBLIC_CONFIG,
  normalizeRuntimePublicConfig,
  type RuntimePublicConfig,
} from "@/config/runtimePublicConfig";
import { getPublicRuntimeConfig } from "@/server/runtime-config/service";

/**
 * 服务端读取公开运行时配置。
 *
 * 当数据库读取失败时，降级到注册表默认值。
 *
 * @returns 完整公开配置对象
 */
export async function getServerRuntimePublicConfig(): Promise<RuntimePublicConfig> {
  try {
    const raw = await getPublicRuntimeConfig();
    return normalizeRuntimePublicConfig(raw);
  } catch {
    return DEFAULT_RUNTIME_PUBLIC_CONFIG;
  }
}
