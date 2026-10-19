import Link from '@/components/Common/TransitionLink';
import { getLocalPostsList } from '@/utils/content/local';
import style from '../BlogPost.module.css';

/** 独立服务端流式边界：系列与推荐不参与文章正文的就绪条件。 */
export default async function RelatedPosts({ slug, locale, seriesId }: { slug: string; locale: string; seriesId?: string }) {
    const limit = Number.parseInt(process.env.NEXT_PUBLIC_BLOG_RELATED_LIMIT || '50', 10) || 50;
    const data = await getLocalPostsList(0, limit, locale).catch(() => ({ items: [] }));
    const series = process.env.NEXT_PUBLIC_BLOG_SERIES_ENABLED !== 'false' && seriesId
        ? data.items.filter(item => item.series?.id === seriesId) : [];
    const recommended = process.env.NEXT_PUBLIC_BLOG_RECOMMEND_ENABLED !== 'false'
        ? data.items.filter(item => item.isRecommended && item.slug !== slug).slice(0, 4) : [];
    return <>
        {series.length > 1 && <section className={style.post_series_section}>
            <h2 className={style.post_series_title}>{locale === 'zh-CN' ? '系列文章' : 'Series'}</h2>
            <ul className={style.post_series_list}>{series.map(item => <li key={item.slug} className={item.slug === slug ? style.post_series_item_active : style.post_series_item}>
                <Link href={`/blog/${item.slug}`}>{item.title}</Link>
            </li>)}</ul>
        </section>}
        {recommended.length > 0 && <section className={style.post_recommend_section}>
            <h2 className={style.post_recommend_title}>{locale === 'zh-CN' ? '推荐文章' : 'Recommended'}</h2>
            <ul className={style.post_recommend_list}>{recommended.map(item => <li key={item.slug} className={style.post_recommend_item}>
                <Link href={`/blog/${item.slug}`}>{item.title}</Link>
            </li>)}</ul>
        </section>}
    </>;
}
