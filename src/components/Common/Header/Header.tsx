"use client";

import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AiFillSun, AiFillMoon, AiFillHome } from "react-icons/ai";
import { FaLink, FaBook, FaBars } from "react-icons/fa";
import { FiX } from "react-icons/fi";
import { MdTranslate } from "react-icons/md";
import { profile } from "../../../profile";
import style from './Header.module.css';
import { useI18n } from "@/context/I18nContext";

type Theme = 'light' | 'dark';

const DEFAULT_THEME: Theme = 'light';
let themeSnapshot: Theme = DEFAULT_THEME;
const themeListeners = new Set<() => void>();

const readPreferredTheme = (): Theme => {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  const saved = window.localStorage.getItem('theme');
  if (saved === 'light' || saved === 'dark') return saved;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
};

const emitThemeChange = () => {
  themeListeners.forEach((listener) => listener());
};

const setThemeSnapshot = (nextTheme: Theme) => {
  if (themeSnapshot === nextTheme) return;
  themeSnapshot = nextTheme;

  if (typeof window !== 'undefined') {
    window.localStorage.setItem('theme', nextTheme);
  }

  emitThemeChange();
};

const onThemeStorage = (event: StorageEvent) => {
  if (event.key !== 'theme') return;
  setThemeSnapshot(readPreferredTheme());
};

const subscribeTheme = (listener: () => void) => {
  themeListeners.add(listener);
  if (themeListeners.size === 1 && typeof window !== 'undefined') {
    window.addEventListener('storage', onThemeStorage);
  }

  return () => {
    themeListeners.delete(listener);
    if (themeListeners.size === 0 && typeof window !== 'undefined') {
      window.removeEventListener('storage', onThemeStorage);
    }
  };
};

const getThemeSnapshot = () => themeSnapshot;
const getThemeServerSnapshot = () => DEFAULT_THEME;

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

  // 博客外部链接配置
  const blogMode = process.env.NEXT_PUBLIC_BLOG_MODE;
  const blogUrl = process.env.NEXT_PUBLIC_BLOG_URL;

  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getThemeServerSnapshot);
  const [isMenuOpenState, setIsMenuOpenState] = useState<{ isOpen: boolean; path: string }>(() => {
    return { isOpen: false, path: pathname || '' };
  });

  const isMenuOpen = isMenuOpenState.isOpen && isMenuOpenState.path === (pathname || '');

  useEffect(() => {
    setThemeSnapshot(readPreferredTheme());
  }, []);

  // 监听主题变化并应用到 body
  useEffect(() => {
    document.body.className = theme;
    document.body.setAttribute('data-theme', theme);
    
    if (themeToggle.current) {
      themeToggle.current.setAttribute('aria-label', theme === 'light' ? '切换到暗色模式' : '切换到亮色模式');
    }
  }, [theme]);

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
    setThemeSnapshot(theme === 'light' ? 'dark' : 'light');
  };

  // 切换语言处理函数
  const handleLanguageToggle = () => {
    setLocale(locale === 'zh-CN' ? 'en-US' : 'zh-CN');
  };

  // 切换移动端菜单
  const toggleMenu = () => {
    const current = pathname || '';
    setIsMenuOpenState((prev) => {
      const shouldOpen = !(prev.isOpen && prev.path === current);
      return { isOpen: shouldOpen, path: current };
    });
  };

  // 关闭移动端菜单
  const closeMenu = () => {
    setIsMenuOpenState({ isOpen: false, path: pathname || '' });
  };

  // 移动端切换语言
  const handleMobileLanguageToggle = () => {
    handleLanguageToggle();
    closeMenu();
  };

  // 移动端切换主题
  const handleMobileThemeToggle = () => {
    handleThemeToggle();
    closeMenu();
  };

  // 获取当前语言对应的导航标题
  const navTitle = locale === 'en-US'
    ? (process.env.NEXT_PUBLIC_NAV_TITLE_EN || profile.navTitle)
    : profile.navTitle;

  return (
    <nav className={`${style.nav} ${isScrolled ? style.scrolled : ''}`}>
      <div className={style.nav_wrapper}>
        <div className={style.nav_title}>
          <Link className={style.nav_logo} href="/">{navTitle}</Link>
        </div>

        {/* 桌面端导航 */}
        <div className={style.nav_itemsList}>
          <Link className={`${style.nav_item} ${currentPath === '/' ? style.active : ''}`} href='/'><AiFillHome /> {t('Pages.Home')}</Link>
          {(blogMode === 'external' && blogUrl) ? (
            <a 
              className={`${style.nav_item}`} 
              href={blogUrl} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <FaBook /> {t('Pages.Blog')}
            </a>
          ) : (
            <Link className={`${style.nav_item} ${currentPath.startsWith('/blog') ? style.active : ''}`} href='/blog'><FaBook /> {t('Pages.Blog')}</Link>
          )}
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

        {/* 移动端汉堡菜单按钮 */}
        <button 
            className={style.hamburger} 
            onClick={toggleMenu}
            aria-label="Toggle menu"
        >
            {isMenuOpen ? <FiX /> : <FaBars />}
        </button>

        {/* 移动端菜单面板 */}
        <div className={`${style.mobile_menu} ${isMenuOpen ? style.mobile_menu_open : ''}`}>
            <div className={style.mobile_menu_items}>
                <Link 
                  className={`${style.mobile_nav_item} ${currentPath === '/' ? style.active : ''}`} 
                  href='/' 
                  onClick={closeMenu}
                >
                  <AiFillHome /> {t('Pages.Home')}
                </Link>
                {(blogMode === 'external' && blogUrl) ? (
                  <a 
                    className={`${style.mobile_nav_item}`} 
                    href={blogUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={closeMenu}
                  >
                    <FaBook /> {t('Pages.Blog')}
                  </a>
                ) : (
                  <Link 
                    className={`${style.mobile_nav_item} ${currentPath.startsWith('/blog') ? style.active : ''}`} 
                    href='/blog'
                    onClick={closeMenu}
                  >
                    <FaBook /> {t('Pages.Blog')}
                  </Link>
                )}
                <Link 
                  className={`${style.mobile_nav_item} ${currentPath === '/links' ? style.active : ''}`} 
                  href='/links'
                  onClick={closeMenu}
                >
                  <FaLink /> {t('Pages.Links')}
                </Link>
                
                <div className={style.mobile_controls}>
                    <button 
                        className={style.mobile_control_btn}  
                        onClick={handleMobileLanguageToggle}
                        type="button"
                    >
                        <MdTranslate /> {locale === 'zh-CN' ? 'English' : '中文'}
                    </button>
                    <button 
                        className={style.mobile_control_btn} 
                        onClick={handleMobileThemeToggle}
                        type="button"
                    >
                        {theme === 'light' ? <><AiFillMoon /> 暗色模式</> : <><AiFillSun /> 亮色模式</>}
                    </button>
                </div>
            </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
