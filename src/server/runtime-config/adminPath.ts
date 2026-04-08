import { getAdminEntryPath } from "@/server/runtime-config/service";

/**
 * 服务端读取后台入口路径。
 *
 * @returns 后台入口
 */
export async function getServerAdminPath(): Promise<string> {
  return getAdminEntryPath();
}
