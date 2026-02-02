import StatusPage from '@/components/Common/StatusPage/StatusPage';

// 403 错误页面
export default function ForbiddenPage() {
  return <StatusPage code={403} secondaryHref={{ href: '/blog', labelKey: 'Error.BackToBlog' }} />;
}
