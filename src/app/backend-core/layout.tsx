import React from 'react';
import Link from 'next/link';

interface AdminLayoutProps {
  children: React.ReactNode;
}

/**
 * 后台统一布局组件
 *
 * 提供简单的导航栏与内容容器，用于包裹所有后台页面，
 * 避免在各个页面中重复书写布局结构，保持样式与交互一致。
 *
 * @param props.children 子页面节点
 * @returns 后台布局 JSX 节点
 */
const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          borderBottom: '1px solid #e5e7eb',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            fontWeight: 600,
          }}
        >
          YoSpace Admin
        </div>
        <nav
          style={{
            display: 'flex',
            gap: 16,
            fontSize: 14,
          }}
        >
          <Link href=".">仪表盘</Link>
          <Link href="posts">文章管理</Link>
        </nav>
      </header>
      <main
        style={{
          flex: 1,
          padding: '16px',
          maxWidth: 960,
          margin: '0 auto',
          width: '100%',
        }}
      >
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;

