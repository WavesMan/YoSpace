import React from "react";
import { getServerAdminPath } from "@/server/runtime-config/adminPath";
import SettingsClientTranslated from "./SettingsClientTranslated";

/**
 * 后台设置页服务端入口
 *
 * 读取当前动态后台入口，并注入到客户端设置中心。
 *
 * @returns 设置页节点
 */
export default async function SettingsRuntimePage() {
  const initialAdminPath = await getServerAdminPath();
  return <SettingsClientTranslated initialAdminPath={initialAdminPath} />;
}
