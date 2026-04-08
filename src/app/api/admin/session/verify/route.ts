import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/server/auth/service";
import { ADMIN_SESSION_COOKIE_KEY } from "@/server/auth/adminAuth";

/**
 * 管理员会话校验接口。
 *
 * 供中间件与服务端校验当前 Cookie 会话是否有效。
 *
 * @param request 请求对象
 * @returns 校验结果
 */
export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const tokenMatch = cookieHeader.match(new RegExp(`${ADMIN_SESSION_COOKIE_KEY}=([^;]+)`));
  const sessionToken = tokenMatch?.[1] || "";

  const verifyResult = await verifyAdminSession(sessionToken);
  return NextResponse.json({
    ok: verifyResult.valid,
    username: verifyResult.username || "",
  });
}
