import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/server/auth/adminAuth";
import { setRuntimeConfigValue } from "@/server/runtime-config/service";

/**
 * 修改后台入口路径。
 *
 * @param request 请求对象
 * @returns 更新结果
 */
export async function POST(request: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ message: "未授权" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const nextPath = typeof body?.path === "string" ? body.path : "";
    await setRuntimeConfigValue("NEXT_PUBLIC_ADMIN_PATH", nextPath);
    return NextResponse.json({ message: "后台入口已更新" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "更新失败";
    return NextResponse.json({ message }, { status: 400 });
  }
}
