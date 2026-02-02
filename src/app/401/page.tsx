import StatusPage from '@/components/Common/StatusPage/StatusPage';

// 401 错误页面
export default function UnauthorizedPage() {
  return <StatusPage code={401} secondaryHref={{ href: '/blog', labelKey: 'Error.BackToBlog' }} />;
}
