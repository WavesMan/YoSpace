"use client";

import { FaBilibili, FaYoutube } from "react-icons/fa6";
import { MdEmail } from "react-icons/md";
import { FaGithub, FaQq, FaTelegram, FaTwitter } from "react-icons/fa";
import { BsTwitterX } from "react-icons/bs";
import React, { JSX, useRef, useState } from "react";
import style from './Profile.module.css'
import { profile } from '../../profile'
import { useI18n } from "@/context/I18nContext";

/**
 * 个人简介组件
 * 
 * 展示头像、名字（可点击切换）、座右铭以及社交媒体链接。
 */
const Profile = () => {
    const { t } = useI18n();

    const [nameClicked, setNameClicked] = useState(0) // 初始为0更符合数组索引习惯
    const profileName = useRef<HTMLHeadingElement | null>(null)

    const profileNames = profile.names;

    const handleNameClick = () => {
        const nextIndex = (nameClicked + 1) % profileNames.length;
        setNameClicked(nextIndex);
        // React 会自动重新渲染，不需要手动操作 DOM textContent，除非是为了动画效果
        // 原代码使用了 useRef 直接操作 DOM，这里保留原逻辑结构，但改为 React 状态驱动更佳
    }

    // 社交图标映射表
    const socialIcons: { [key: string]: JSX.Element } = {
        github: <FaGithub />,
        youtube: <FaYoutube />,
        bilibili: <FaBilibili />,
        telegram: <FaTelegram />,
        qq: <FaQq />,
        twitter: <FaTwitter />,
        x: <BsTwitterX />,
        email: <MdEmail />,
    };

    return (
        <div className={style.profile_wrapper}>
            <div className={style.profile_container}>
                <div className={style.profile_image_wrapper}>
                    {/* 
                        使用 img 标签以保持原样式兼容性。
                        如果使用 Next.js Image 组件，需要注意 CSS 适配。
                    */}
                    <img src={profile.image} className={style.profile_image} alt="Profile Avatar" />
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
                        <p className={style.profile_info_signature}>{profile.description}</p>
                    </div>
                    <div className={style.profile_social_wrapper}>
                        {Object.entries(profile.socialLinks).map(([key, link]) => (
                            <a
                                key={key}
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={style.profile_social_item}
                                aria-label={key}
                            >
                                {socialIcons[key] || key}
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
