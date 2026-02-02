import Image from "next/image";
import React from "react";
import style from "./LinksCard.module.css"

interface LinksCardProps {
    title: string;
    subtitle?: string;
    link: string;
    avatar: string;
}

/**
 * 友链卡片组件
 * 
 * 展示单个友链信息，包括头像、标题和副标题。
 * 点击卡片会在新标签页打开链接。
 */
const LinksCard: React.FC<LinksCardProps> = ({ title, subtitle, link, avatar }) => {
    return (
        <div className={style.links_card_wrapper}>
            <div 
                className={style.links_card_container} 
                onClick={() => window.open(link, "_blank")}
                role="link"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        window.open(link, "_blank");
                    }
                }}
            >
                <Image className={style.links_card_avatar} src={avatar} alt={`${title}'s avatar`} width={48} height={48} />
                <div className={style.links_card_content}>
                    <h1 className={style.links_card_title}>{title}</h1>
                    {subtitle && <p className={style.links_card_subtitle}>{subtitle}</p>}
                </div>
            </div>
        </div >
    )
}

export default LinksCard
