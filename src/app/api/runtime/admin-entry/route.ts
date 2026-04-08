import { NextResponse } from "next/server";
import { getAdminEntryPath } from "@/server/runtime-config/service";

/**
 * 读取当前后台入口路径。
 *
 * @returns 后台入口配置
 */
export async function GET() {
  const adminPath = await getAdminEntryPath();
  return NextResponse.json({ adminPath });
}