"use client";

import { useMemo } from "react";
import Background from '../Common/Background/Background'
import style from './Links.module.css'
import LinksCard from './LinksCard'
import { useI18n } from '@/context/I18nContext'
import { useRuntimePublicConfig } from "@/context/RuntimePublicConfigContext";
import { parseFriendLinksFromRuntime } from "@/config/runtimeStructuredData";

/**
 * 友链列表展示组件
 * 
 * 渲染友链页面主体内容，包括标题、卡片列表和背景。
 */
const Links = () => {
    const { t } = useI18n();
    const runtimeConfig = useRuntimePublicConfig();
    const links = useMemo(() => parseFriendLinksFromRuntime(runtimeConfig), [runtimeConfig]);
    return (
        <>
            <div className={style.links_wrapper}>
                <div className={style.links_container}>
                    <h1 className={style.links_title}>{t('Pages.Links')}</h1>
                    <div className={style.links_card_wrapper}>
                        <div className={style.links_card_container}>
                            {
                                links.map((item, index) => {
                                    return (
                                        <LinksCard
                                            key={index}
                                            title={item.title}
                                            subtitle={item.subtitle}
                                            link={item.link}
                                            avatar={item.avatar}
                                        />
                                    )
                                })
                            }
                        </div>
                    </div>
                </div>
            </div>
            <Background text="LINKS" />
        </>
    )
}

export default Links
