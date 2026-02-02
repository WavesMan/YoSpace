import StatusPage from '@/components/Common/StatusPage/StatusPage';

export default function ForbiddenPage() {
  return <StatusPage code={403} secondaryHref={{ href: '/blog', labelKey: 'Error.BackToBlog' }} />;
}
