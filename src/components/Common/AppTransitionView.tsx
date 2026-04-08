import React from "react";

interface AppTransitionViewProps {
  className?: string;
  busy?: boolean;
}

/**
 * 应用路由过渡视图
 *
 * 仅负责渲染统一的 Loading 过渡 UI，不包含触发逻辑。
 *
 * @returns 过渡视图节点
 */
const AppTransitionView = ({ className = "app_transition app_transition_visible", busy = true }: AppTransitionViewProps) => {
  return (
    <div className={className} aria-live="polite" aria-busy={busy} role="status">
      <div className="app_transition_card">
        <div className="app_transition_spinner" />
        <div className="app_transition_content">
          <div className="app_transition_title">页面正在切换</div>
          <div className="app_transition_text">内容加载完成后自动进入下一页</div>
        </div>
      </div>
    </div>
  );
};

export default AppTransitionView;
