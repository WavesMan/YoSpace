import StatusPage from '@/components/Common/StatusPage/StatusPage';

export default function BadRequestPage() {
  return <StatusPage code={400} secondaryHref={{ href: '/links', labelKey: 'Pages.Links' }} />;
}

