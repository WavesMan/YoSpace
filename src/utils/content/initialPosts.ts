import { cookies, headers } from 'next/headers';
import { getLocalPostsList } from './local';
import { resolveRequestLocale } from '../requestLocale';

/** 服务端统一提供聚合页首批数据，省去挂载后再请求列表的往返。 */
export async function getInitialPosts() {
    const [cookieStore, requestHeaders] = await Promise.all([cookies(), headers()]);
    const initialLocale = resolveRequestLocale(cookieStore.get('locale')?.value, requestHeaders.get('accept-language')?.toLowerCase() || '');
    try {
        const data = await getLocalPostsList(0, 1000, initialLocale === 'zh-CN' ? 'zh-CN' : 'en');
        return { initialPosts: data.items, initialLocale };
    } catch {
        // 让客户端保留错误与重试路径，不把读取失败当作空列表。
        return { initialLocale };
    }
}
