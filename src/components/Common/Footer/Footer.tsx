"use client";

import React from "react";
import style from "./Footer.module.css"

/**
 * 底部页脚组件
 * 
 * 显示ICP备案信息等。
 * 环境变量:
 * - NEXT_PUBLIC_MIIT_LICENSE: ICP备案号 (e.g., ICP备XXXXXX号)
 * - NEXT_PUBLIC_POLICE_LICENSE: 公安联网备案号 (e.g., 浙公网安备 33052202000779号)
 */
const Footer = () => {
    // Next.js 中访问公共环境变量需要使用 NEXT_PUBLIC_ 前缀
    const miitLicense: string | undefined = process.env.NEXT_PUBLIC_MIIT_LICENSE;
    const policeLicense: string | undefined = process.env.NEXT_PUBLIC_POLICE_LICENSE;

    // 提取公安备案号中的数字用于生成链接
    // 假设格式为 "浙公网安备 33052202000779号" -> 提取 "33052202000779"
    const policeLicenseNo = policeLicense ? policeLicense.match(/\d+/)?.[0] : undefined;

    if (!miitLicense && !policeLicense) {
        return null;
    }

    return (
        <div className={style.footer_wrapper}>
            <div className={style.footer_container}>
                <div className={style.footer_miit}>
                    {miitLicense && (
                        <a href="https://beian.miit.gov.cn" target="_blank" rel="noopener noreferrer">
                            {miitLicense}
                        </a>
                    )}
                    
                    {miitLicense && policeLicense && " | "}
                    
                    {policeLicense && (
                        <a 
                            target="_blank" 
                            href={policeLicenseNo ? `http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=${policeLicenseNo}` : "http://www.beian.gov.cn/portal/registerSystemInfo"} 
                            rel="noopener noreferrer"
                        >
                            {policeLicense}
                        </a>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Footer
