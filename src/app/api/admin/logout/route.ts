import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE_KEY, ADMIN_USERNAME_COOKIE_KEY } from "@/server/auth/adminAuth";
import { revokeAdminSession } from "@/server/auth/service";

/**
 * 管理员登出接口。
 *
 * 使当前会话失效并清理 Cookie。
 *
 * @returns 登出结果
 */
export async function POST(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const tokenMatch = cookieHeader.match(/yo_admin_session=([^;]+)/);
  const sessionToken = tokenMatch?.[1] || "";

  await revokeAdminSession(sessionToken);

  const response = NextResponse.json({ message: "Logout success" });
  response.cookies.set(ADMIN_SESSION_COOKIE_KEY, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  response.cookies.set(ADMIN_USERNAME_COOKIE_KEY, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
