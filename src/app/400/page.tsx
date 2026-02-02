import StatusPage from '@/components/Common/StatusPage/StatusPage';

// 400 错误页面
export default function BadRequestPage() {
  return <StatusPage code={400} secondaryHref={{ href: '/links', labelKey: 'Pages.Links' }} />;
}

