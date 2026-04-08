import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE_KEY } from "@/server/auth/adminAuth";
import { changeAdminCredentials, verifyAdminSession } from "@/server/auth/service";

/**
 * 仅修改管理员密码。
 *
 * @param request 请求对象
 * @returns 修改结果
 */
export async function POST(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie") || "";
  const tokenMatch = cookieHeader.match(new RegExp(`${ADMIN_SESSION_COOKIE_KEY}=([^;]+)`));
  const sessionToken = tokenMatch?.[1] || "";

  const verifyResult = await verifyAdminSession(sessionToken);
  if (!verifyResult.valid || !verifyResult.accountId || !verifyResult.username) {
    return NextResponse.json({ message: "未授权" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const oldPassword = typeof body?.oldPassword === "string" ? body.oldPassword : "";
    const nextPassword = typeof body?.nextPassword === "string" ? body.nextPassword : "";

    await changeAdminCredentials({
      accountId: verifyResult.accountId,
      oldPassword,
      nextPassword,
      nextUsername: verifyResult.username,
    });

    return NextResponse.json({ message: "密码更新成功，请重新登录" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "更新失败";
    return NextResponse.json({ message }, { status: 400 });
  }
}
