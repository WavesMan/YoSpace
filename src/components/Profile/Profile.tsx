"use client";

import React, { JSX, useRef, useState } from "react";
import DynamicIcon from "../Common/Icon/DynamicIcon";
import style from './Profile.module.css'
import { profile } from '../../profile'
import { useI18n } from "@/context/I18nContext";

/**
 * 个人简介组件
 * 
 * 展示头像、名字（可点击切换）、座右铭以及社交媒体链接。
 */
const Profile = () => {
    const { t, locale } = useI18n();

    const [nameClicked, setNameClicked] = useState(0) // 初始为0更符合数组索引习惯
    const profileName = useRef<HTMLHeadingElement | null>(null)

    const isEn = locale === 'en-US';

    const profileNames = isEn && process.env.NEXT_PUBLIC_PROFILE_NAMES_EN
        ? process.env.NEXT_PUBLIC_PROFILE_NAMES_EN.split(',')
        : profile.names;

    const description = isEn
        ? (process.env.NEXT_PUBLIC_SITE_DESCRIPTION_EN || profile.description)
        : profile.description;

    const handleNameClick = () => {
        const nextIndex = (nameClicked + 1) % profileNames.length;
        setNameClicked(nextIndex);
        // React 会自动重新渲染，不需要手动操作 DOM textContent，除非是为了动画效果
        // 原代码使用了 useRef 直接操作 DOM，这里保留原逻辑结构，但改为 React 状态驱动更佳
    }

    // 获取头像 URL，优先使用环境变量，否则回退到 profile.ts 中的配置
    const profileImage = process.env.NEXT_PUBLIC_PROFILE_IMAGE || profile.image;

    return (
        <div className={style.profile_wrapper}>
            <div className={style.profile_container}>
                <div className={style.profile_image_wrapper}>
                    {/* 
                        使用 img 标签以保持原样式兼容性。
                        如果使用 Next.js Image 组件，需要注意 CSS 适配。
                    */}
                    <img src={profileImage} className={style.profile_image} alt="Profile Avatar" />
                </div>
                <div className={style.profile_content_wrapper}>
                    <div className={style.profile_info_wrapper}>
                        <h1 
                            className={style.profile_info_name} 
                            ref={profileName} 
                            onClick={handleNameClick} 
                            title={t('Profile.ClickToSwitch')}
                        >
                            {profileNames[nameClicked]}
                        </h1>
                        <p className={style.profile_info_signature}>{description}</p>
                    </div>
                    <div className={style.profile_social_wrapper}>
                        {profile.socialLinks.map((item, index) => (
                            <a
                                key={index}
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={style.profile_social_item}
                                aria-label={item.name}
                            >
                                {item.iconUrl ? (
                                    <img 
                                        src={item.iconUrl} 
                                        alt={item.name} 
                                        style={{ width: '1em', height: '1em', objectFit: 'contain' }} 
                                    />
                                ) : (
                                    item.iconPackage && item.iconName ? (
                                        <DynamicIcon packageName={item.iconPackage} iconName={item.iconName} />
                                    ) : (
                                        item.name
                                    )
                                )}
                            </a>
                        ))}
                    </div>
                </div>
            </div>
            <p className={style.profile_background}>{`<PROFILE/>`}</p>
        </div>
    )
}

export default Profile
