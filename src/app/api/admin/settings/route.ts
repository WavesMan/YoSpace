import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/server/auth/adminAuth";
import {
  getAllRuntimeConfig,
  setRuntimeConfigValues,
} from "@/server/runtime-config/service";
import { RUNTIME_CONFIG_DEFINITIONS, RUNTIME_CONFIG_KEY_SET } from "@/server/runtime-config/registry";

/**
 * 读取后台设置配置。
 *
 * @returns 配置定义与当前值
 */
export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ message: "未授权" }, { status: 401 });
  }

  const values = await getAllRuntimeConfig();
  return NextResponse.json({
    items: RUNTIME_CONFIG_DEFINITIONS.map(item => ({
      key: item.key,
      label: item.label,
      type: item.type,
      isPublic: item.isPublic,
      description: item.description,
      value: values[item.key],
    })),
  });
}

/**
 * 更新后台设置配置。
 *
 * @param request 请求对象
 * @returns 更新结果
 */
export async function PUT(request: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ message: "未授权" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const updates = body?.updates as Record<string, unknown>;

    if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
      return NextResponse.json({ message: "updates 参数格式非法" }, { status: 400 });
    }

    const unknownKeys = Object.keys(updates).filter(key => !RUNTIME_CONFIG_KEY_SET.has(key));
    if (unknownKeys.length > 0) {
      return NextResponse.json({ message: `存在未知配置键: ${unknownKeys.join(", ")}` }, { status: 400 });
    }

    await setRuntimeConfigValues(updates);
    return NextResponse.json({ message: "保存成功" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "保存失败";
    return NextResponse.json({ message }, { status: 400 });
  }
}
