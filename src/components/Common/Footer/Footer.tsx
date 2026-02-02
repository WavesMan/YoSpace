"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import style from "./Footer.module.css"

/**
 * 底部页脚组件
 * 
 * 显示ICP备案信息等。
 * 环境变量:
 * - NEXT_PUBLIC_ICP_CODE: ICP备案号 (e.g., ICP备XXXXXX号)
 * - NEXT_PUBLIC_POLICE_LICENSE: 公安联网备案号 (e.g., 浙公网安备 33052202000779号)
 */
const Footer = () => {
    const pathname = usePathname();

    // Next.js 中访问公共环境变量需要使用 NEXT_PUBLIC_ 前缀
    const icpCode: string | undefined = process.env.NEXT_PUBLIC_ICP_CODE;
    const policeLicense: string | undefined = process.env.NEXT_PUBLIC_POLICE_LICENSE;
    const siteNameRaw: string | undefined = process.env.NEXT_PUBLIC_SITE_NAME;
    const siteStartYearRaw: string | undefined = process.env.NEXT_PUBLIC_SITE_START_YEAR;

    const [currentYear] = useState<number>(new Date().getFullYear());
    const [shouldStaticOnMobile, setShouldStaticOnMobile] = useState(false);

    

    useEffect(() => {
        if (typeof window === 'undefined') return;

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

    const siteName = (siteNameRaw || "WaveYo").trim();
    const startYear = useMemo(() => {
        const parsed = Number.parseInt((siteStartYearRaw || "").trim(), 10);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }, [siteStartYearRaw]);

    const copyrightText = useMemo(() => {
        if (!currentYear) return null;
        if (startYear && startYear < currentYear) {
            return `© ${startYear} - ${currentYear} ${siteName}`;
        }
        return `© ${currentYear} ${siteName}`;
    }, [currentYear, siteName, startYear]);

    // 提取公安备案号中的数字用于生成链接
    // 假设格式为 "浙公网安备 33052202000779号" -> 提取 "33052202000779"
    const policeLicenseNo = policeLicense ? policeLicense.match(/\d+/)?.[0] : undefined;

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
        return null;
    }

    return (
        <div className={`${style.footer_wrapper} ${shouldStaticOnMobile ? style.footer_wrapper_mobile_static : ''}`}>
            <div className={style.footer_container}>
                <div className={style.footer_miit}>
                    {footerItems.map((item, index) => (
                        <React.Fragment key={item.key ?? index}>
                            {index > 0 ? <span className={style.separator}>|</span> : null}
                            {item}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Footer
