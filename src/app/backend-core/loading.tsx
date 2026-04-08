import React from "react";
import AppTransitionView from "@/components/Common/AppTransitionView";

/**
 * 后台路由加载中间页
 *
 * 在后台路由切换期间立即展示统一过渡态，待目标页数据完成后自动替换。
 *
 * @returns 后台加载中间页节点
 */
const BackendCoreLoading = () => {
  return <AppTransitionView />;
};

export default BackendCoreLoading;
