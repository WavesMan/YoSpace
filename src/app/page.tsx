import Home from './Home';
import { buildUrl, pageMetadata, seoConfig, serializeJsonLd } from '@/utils/seo';

export const metadata = pageMetadata('/', seoConfig.defaultTitle, seoConfig.defaultDescription, true);

export default function HomePage() {
    const website = { '@context': 'https://schema.org', '@type': 'WebSite', name: seoConfig.siteName, url: buildUrl('/') };
    return <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(website) }} />
        <Home />
    </>;
}
