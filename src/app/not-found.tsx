import StatusPage from '@/components/Common/StatusPage/StatusPage';

export default function NotFound() {
  return <StatusPage code={404} secondaryHref={{ href: '/blog', labelKey: 'Error.BackToBlog' }} />;
}

