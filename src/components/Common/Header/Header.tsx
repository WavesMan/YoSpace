"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AiFillSun, AiFillMoon, AiFillHome } from "react-icons/ai";
import { FaLink, FaBook } from "react-icons/fa";
import { MdTranslate } from "react-icons/md";
import { profile } from "../../../profile";
import style from './Header.module.css';
import { useI18n } from "@/context/I18nContext";

/**
 * 顶部导航栏组件
 * 
 * 包含网站Logo、导航链接、主题切换和语言切换功能。
 * 响应式设计，支持滚动时改变样式。
 */
const Header: React.FC = () => {
  const pathname = usePathname();
  const currentPath = pathname;
  const { t, locale, setLocale } = useI18n();

  // 主题状态管理
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // 初始化主题
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    setMounted(true);
  }, []);

  // 监听主题变化并应用到 body
  useEffect(() => {
    if (!mounted) return;
    document.body.className = theme;
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    if (themeToggle.current) {
      themeToggle.current.setAttribute('aria-label', theme === 'light' ? '切换到暗色模式' : '切换到亮色模式');
    }
  }, [theme, mounted]);

  // 滚动状态管理
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50); // 当滚动超过 50px 时，设置为 true
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const themeToggle = useRef<HTMLButtonElement | null>(null);
  
  // 切换主题处理函数
  const handleThemeToggle = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // 切换语言处理函数
  const handleLanguageToggle = () => {
    setLocale(locale === 'zh-CN' ? 'en-US' : 'zh-CN');
  };

  // 避免服务端渲染时的不匹配
  if (!mounted) {
    return <nav className={style.nav} style={{ opacity: 0 }} />;
  }

  return (
    <nav className={`${style.nav} ${isScrolled ? style.scrolled : ''}`}>
      <div className={style.nav_wrapper}>
        <div className={style.nav_title}>
          <Link className={style.nav_logo} href="/">{profile.sitename}</Link>
        </div>
        <div className={style.nav_itemsList}>
          <Link className={`${style.nav_item} ${currentPath === '/' ? style.active : ''}`} href='/'><AiFillHome /> {t('Pages.Home')}</Link>
          <Link className={`${style.nav_item} ${currentPath.startsWith('/blog') ? style.active : ''}`} href='/blog'><FaBook /> {t('Pages.Blog')}</Link>
          <Link className={`${style.nav_item} ${currentPath === '/links' ? style.active : ''}`} href='/links'><FaLink /> {t('Pages.Links')}</Link>
          <button 
            className={`${style.nav_item} ${style.nav_toggle}`}  
            onClick={handleLanguageToggle}
            type="button"
            aria-label={locale === 'zh-CN' ? 'Switch to English' : '切换到中文'}
            title={locale === 'zh-CN' ? 'Switch to English' : '切换到中文'}
          >
            <MdTranslate />
          </button>
          <button 
            className={`${style.nav_item} ${style.nav_toggle}`} 
            ref={themeToggle} 
            onClick={handleThemeToggle}
            type="button"
          >
            {theme === 'light' ? <AiFillMoon /> : <AiFillSun />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Header;
