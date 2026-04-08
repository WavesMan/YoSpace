import { NextResponse } from "next/server";
import { getPublicRuntimeConfig } from "@/server/runtime-config/service";

/**
 * 读取公开运行时配置。
 *
 * @returns 可暴露给前端的配置项
 */
export async function GET() {
  const config = await getPublicRuntimeConfig();
  return NextResponse.json({ config });
}
