import StatusPage from '@/components/Common/StatusPage/StatusPage';

export default function UnauthorizedPage() {
  return <StatusPage code={401} secondaryHref={{ href: '/blog', labelKey: 'Error.BackToBlog' }} />;
}
