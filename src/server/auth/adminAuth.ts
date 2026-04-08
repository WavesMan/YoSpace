import { cookies } from "next/headers";
import { verifyAdminSession } from "@/server/auth/service";

export const ADMIN_SESSION_COOKIE_KEY = "yo_admin_session";
export const ADMIN_USERNAME_COOKIE_KEY = "yo_admin_username";

/**
 * 判断当前请求是否已通过管理员认证。
 *
 * @returns 是否为管理员请求
 */
export async function isAdminRequest(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE_KEY)?.value || "";
  const verifyResult = await verifyAdminSession(sessionToken);
  return verifyResult.valid;
}

/**
 * 获取当前管理员用户名。
 *
 * @returns 用户名或空字符串
 */
export async function getCurrentAdminUsername(): Promise<string> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE_KEY)?.value || "";
  const verifyResult = await verifyAdminSession(sessionToken);
  return verifyResult.valid ? verifyResult.username || "" : "";
}
