"use client";

import React from "react";
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
    // Next.js 中访问公共环境变量需要使用 NEXT_PUBLIC_ 前缀
    const icpCode: string | undefined = process.env.NEXT_PUBLIC_ICP_CODE;
    const policeLicense: string | undefined = process.env.NEXT_PUBLIC_POLICE_LICENSE;

    // 提取公安备案号中的数字用于生成链接
    // 假设格式为 "浙公网安备 33052202000779号" -> 提取 "33052202000779"
    const policeLicenseNo = policeLicense ? policeLicense.match(/\d+/)?.[0] : undefined;

    if (!icpCode && !policeLicense) {
        return null;
    }

    return (
        <div className={style.footer_wrapper}>
            <div className={style.footer_container}>
                <div className={style.footer_miit}>
                    {icpCode && (
                        <a href="https://beian.miit.gov.cn" target="_blank" rel="noopener noreferrer">
                            {icpCode}
                        </a>
                    )}
                    
                    {icpCode && policeLicense && " | "}
                    
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
