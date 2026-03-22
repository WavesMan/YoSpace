"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import style from "./Footer.module.css";

/**
 * 底部页脚组件
 *
 * 用于展示站点版权信息、ICP备案号与公安备案号等。
 * 依赖环境变量：
 * - NEXT_PUBLIC_ICP_CODE: 工信部ICP备案号
 * - NEXT_PUBLIC_POLICE_LICENSE: 公安备案号
 * - NEXT_PUBLIC_SITE_NAME: 站点名称
 * - NEXT_PUBLIC_SITE_START_YEAR: 站点起始年份（用于显示年份区间）
 */
const Footer = () => {
    const pathname = usePathname();
    const [footerLyric, setFooterLyric] = useState<{
        line: string;
        nextLine: string;
        isPlaying: boolean;
        hasLyric: boolean;
    } | null>(null);

    // NOTE: 来自 Next.js 公共环境变量的站点配置
    const icpCode: string | undefined = process.env.NEXT_PUBLIC_ICP_CODE;
    const policeLicense: string | undefined = process.env.NEXT_PUBLIC_POLICE_LICENSE;
    const siteNameRaw: string | undefined = process.env.NEXT_PUBLIC_SITE_NAME;
    const siteStartYearRaw: string | undefined = process.env.NEXT_PUBLIC_SITE_START_YEAR;

    const [currentYear] = useState<number>(new Date().getFullYear());
    const [shouldStaticOnMobile, setShouldStaticOnMobile] = useState(false);

    // NOTE: 在移动端根据页面是否可滚动决定页脚是否固定在底部
    useEffect(() => {

        const measure = () => {
            const isMobile = window.matchMedia('(max-width: 768px)').matches;
            const scrollHeight = document.documentElement.scrollHeight;
            const viewportHeight = window.innerHeight;
            const isScrollable = scrollHeight > viewportHeight + 8;
            setShouldStaticOnMobile(isMobile && isScrollable);
        };

        measure();
        requestAnimationFrame(measure);

        window.addEventListener('resize', measure);
        return () => {
            window.removeEventListener('resize', measure);
        };
    }, [pathname]);

    /**
     * 监听播放器歌词事件，同步页脚显示
     *
     * 使用示例：
     * // 播放状态变化时自动触发
     *
     * @returns 无返回值
     */
    useEffect(() => {
        /**
         * 处理歌词事件并更新页脚状态
         *
         * 使用示例：
         * // event.detail 包含歌词与播放状态
         *
         * @param event 自定义歌词事件
         * @returns 无返回值
         */
        const handleLyric = (event: Event) => {
            const detail = (event as CustomEvent<{
                line: string;
                nextLine: string;
                isPlaying: boolean;
                hasLyric: boolean;
            }>).detail;
            if (!detail) {
                setFooterLyric(null);
                return;
            }
            setFooterLyric({
                line: detail.line || '',
                nextLine: detail.nextLine || '',
                isPlaying: !!detail.isPlaying,
                hasLyric: !!detail.hasLyric,
            });
        };

        window.addEventListener('music-lyric-update', handleLyric);
        return () => {
            window.removeEventListener('music-lyric-update', handleLyric);
        };
    }, []);

    const siteName = (siteNameRaw || "WaveYo").trim();

    // NOTE: 解析并缓存站点起始年份，用于拼接版权时间段
    const startYear = useMemo(() => {
        const parsed = Number.parseInt((siteStartYearRaw || "").trim(), 10);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }, [siteStartYearRaw]);

    // NOTE: 根据当前年份与起始年份生成版权文案
    const copyrightText = useMemo(() => {
        if (!currentYear) return null;
        if (startYear && startYear < currentYear) {
            return `© ${startYear} - ${currentYear} ${siteName}`;
        }
        return `© ${currentYear} ${siteName}`;
    }, [currentYear, siteName, startYear]);

    // NOTE: 从公安备案号中提取纯数字编码，用于拼接公安备案链接
    const policeLicenseNo = policeLicense ? policeLicense.match(/\d+/)?.[0] : undefined;

    // NOTE: 动态组装需要展示的版权与备案项
    const footerItems: React.ReactElement[] = [];

    if (copyrightText) {
        footerItems.push(
            <div key="copyright" className={style.miit_item}>
                <span className={style.copyright} suppressHydrationWarning>
                    {copyrightText}
                </span>
            </div>
        );
    }

    if (icpCode) {
        footerItems.push(
            <div key="icp" className={style.miit_item}>
                <a href="https://beian.miit.gov.cn" target="_blank" rel="noopener noreferrer">
                    {icpCode}
                </a>
            </div>
        );
    }

    if (policeLicense) {
        footerItems.push(
            <div key="police" className={style.miit_item}>
                <a 
                    target="_blank" 
                    href={policeLicenseNo ? `http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=${policeLicenseNo}` : "http://www.beian.gov.cn/portal/registerSystemInfo"} 
                    rel="noopener noreferrer"
                >
                    {policeLicense}
                </a>
            </div>
        );
    }

    if (footerItems.length === 0) {
        // NOTE: 当没有任何备案信息时不渲染页脚，避免占用额外布局空间
        return null;
    }

    const shouldShowLyric = !!footerLyric?.hasLyric && !!footerLyric?.isPlaying && !!footerLyric?.line;

    // NOTE: 桌面端始终贴底展示，移动端按 shouldStaticOnMobile 控制是否固定
    return (
        <div className={`${style.footer_wrapper} ${shouldStaticOnMobile ? style.footer_wrapper_mobile_static : ''}`}>
            <div className={style.footer_container}>
                {shouldShowLyric ? (
                    <div className={style.footer_lyric}>
                        <div className={style.footer_lyric_line}>
                            {footerLyric?.line}
                        </div>
                        {footerLyric?.nextLine ? (
                            <div className={style.footer_lyric_next}>
                                {footerLyric.nextLine}
                            </div>
                        ) : null}
                    </div>
                ) : (
                    <div className={style.footer_miit}>
                        {footerItems.map((item, index) => (
                            <React.Fragment key={item.key ?? index}>
                                {index > 0 ? <span className={style.separator}>|</span> : null}
                                {item}
                            </React.Fragment>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Footer
