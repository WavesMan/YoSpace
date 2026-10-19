/** 服务端与客户端使用同一国际化开关，避免关闭国际化后仍直出英文内容。 */
export function resolveRequestLocale(savedLocale: string | undefined, acceptLanguage: string): 'zh-CN' | 'en-US' {
    if (process.env.NEXT_PUBLIC_I18N === 'false') return 'zh-CN';
    if (savedLocale === 'en-US' || savedLocale === 'zh-CN') return savedLocale;
    return acceptLanguage.toLowerCase().startsWith('en') ? 'en-US' : 'zh-CN';
}
