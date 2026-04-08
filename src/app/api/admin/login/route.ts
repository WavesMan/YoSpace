import { NextRequest, NextResponse } from "next/server";
import { isAdminSchemaNotReadyError, loginAdminWithPassword } from "@/server/auth/service";
import { ADMIN_SESSION_COOKIE_KEY, ADMIN_USERNAME_COOKIE_KEY } from "@/server/auth/adminAuth";

/**
 * 绠＄悊鍛樼櫥褰曟帴鍙ｃ€? *
 * 浣跨敤鏁版嵁搴撲腑鐨勭鐞嗗憳璐﹀彿杩涜璁よ瘉锛岃璇佹垚鍔熷悗绛惧彂鍙挙閿€浼氳瘽浠ょ墝銆? *
 * @param request 璇锋眰瀵硅薄
 * @returns 鐧诲綍缁撴灉
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const username = typeof body?.username === "string" ? body.username.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!username || !password) {
      return NextResponse.json({ message: "鐢ㄦ埛鍚嶅拰瀵嗙爜涓嶈兘涓虹┖" }, { status: 400 });
    }

    const session = await loginAdminWithPassword(username, password);

    const response = NextResponse.json({ message: "Login success" });
    response.cookies.set(ADMIN_SESSION_COOKIE_KEY, session.sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: session.expiresAt,
    });
    response.cookies.set(ADMIN_USERNAME_COOKIE_KEY, session.username, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: session.expiresAt,
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    if (isAdminSchemaNotReadyError(error)) {
      return NextResponse.json({ message }, { status: 503 });
    }
    const status = message.includes("閿欒") || message.includes("澶辫触") ? 401 : 500;
    return NextResponse.json({ message: status === 401 ? "鐢ㄦ埛鍚嶆垨瀵嗙爜閿欒" : message }, { status });
  }
}
