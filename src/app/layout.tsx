import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import "./globals.css";
import Header from "@/components/Common/Header/Header";
import ClientShell from "@/components/Common/ClientShell";
import { I18nProvider } from "@/context/I18nContext";
import { RuntimePublicConfigProvider } from "@/context/RuntimePublicConfigContext";
import { getServerRuntimePublicConfig } from "@/server/runtime-config/public";
import { DEFAULT_RUNTIME_PUBLIC_CONFIG } from "@/config/runtimePublicConfig";

const themeInitScript = `
  (() => {
    try {
      const saved = window.localStorage.getItem('theme');
      const hasSaved = saved === 'light' || saved === 'dark';
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const theme = hasSaved ? saved : prefersDark ? 'dark' : 'light';

      if (!hasSaved) {
        window.localStorage.setItem('theme', theme);
      }

      document.body.className = theme;
      document.body.setAttribute('data-theme', theme);
    } catch (e) {
    }
  })();
`;

function buildLocaleInitScript(config: {
  NEXT_PUBLIC_I18N: boolean;
  NEXT_PUBLIC_SITE_TITLE: string;
  NEXT_PUBLIC_SITE_TITLE_EN: string;
}) {
  return `
  (() => {
    try {
      const isEnabled = ${JSON.stringify(config.NEXT_PUBLIC_I18N)};
      if (!isEnabled) {
        const titleZh = ${JSON.stringify(config.NEXT_PUBLIC_SITE_TITLE)};
        if (titleZh) {
          document.title = titleZh;
        }
        return;
      }

      const saved = window.localStorage.getItem('locale');
      const browserLang = (window.navigator.language || '').toLowerCase();
      const locale = saved === 'zh-CN' || saved === 'en-US'
        ? saved
        : browserLang.startsWith('en')
          ? 'en-US'
          : 'zh-CN';

      if (saved !== locale) {
        window.localStorage.setItem('locale', locale);
      }
      document.cookie = 'locale=' + locale + '; path=/; max-age=31536000; samesite=lax';
      document.documentElement.lang = locale;

      const titleZh = ${JSON.stringify(config.NEXT_PUBLIC_SITE_TITLE)};
      const titleEn = ${JSON.stringify(config.NEXT_PUBLIC_SITE_TITLE_EN || config.NEXT_PUBLIC_SITE_TITLE)};

      if (locale === 'en-US' && titleEn) {
        document.title = titleEn;
      } else if (titleZh) {
        document.title = titleZh;
      }
    } catch (e) {
    }
  })();
`;
}

const baseMetadata: Metadata = {
  title: DEFAULT_RUNTIME_PUBLIC_CONFIG.NEXT_PUBLIC_SITE_TITLE,
  description: DEFAULT_RUNTIME_PUBLIC_CONFIG.NEXT_PUBLIC_SITE_DESCRIPTION,
  icons: {
    icon: [
      {
        url: "/favicon.ico",
        sizes: "16x16",
        type: "image/x-icon",
      },
      {
        url: "/favicon.ico",
        sizes: "32x32",
        type: "image/x-icon",
      },
      {
        url: "/icon-48.png",
        sizes: "48x48",
        type: "image/png",
      },
      {
        url: "/icon-64.png",
        sizes: "64x64",
        type: "image/png",
      },
      {
        url: "/icon-180.png",
        sizes: "180x180",
        type: "image/png",
      },
      {
        url: "/icon",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const runtimeConfig = await getServerRuntimePublicConfig();
  return {
    ...baseMetadata,
    title: runtimeConfig.NEXT_PUBLIC_SITE_TITLE,
    description: runtimeConfig.NEXT_PUBLIC_SITE_DESCRIPTION,
  };
}

/**
 * 获取后台入口路径前缀
 *
 * @returns 标准化后的后台入口路径
 */
function getAdminEntryPath(injectedPath: string): string {
  const raw = injectedPath || "/admin";
  if (!raw.startsWith("/")) {
    return `/${raw}`;
  }
  return raw;
}

/**
 * 判断当前请求是否命中后台页面
 *
 * @param pathname 请求路径
 * @returns 是否属于后台路由
 */
function isAdminPathname(pathname: string, injectedAdminPath: string): boolean {
  const adminPath = getAdminEntryPath(injectedAdminPath);
  if (pathname === "/backend-core" || pathname.startsWith("/backend-core/")) {
    return true;
  }
  return pathname === adminPath || pathname.startsWith(`${adminPath}/`);
}

/**
 *
 * RootLayout 组件
 *
 * 根据 cookie 与请求头推断首屏语言，避免首屏语言闪烁。
 *
 * @param children 页面内容节点
 * @returns 应用根布局结构
 *
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const runtimeConfig = await getServerRuntimePublicConfig();
  const cookieStore = await cookies();
  const savedLocale = cookieStore.get('locale')?.value;
  const requestHeaders = await headers();
  const requestPathname = requestHeaders.get("x-yospace-pathname") || "";
  const injectedAdminPath = requestHeaders.get("x-yospace-admin-path") || "";
  const shouldRenderPublicShell = !isAdminPathname(requestPathname, injectedAdminPath);
  const acceptLang = requestHeaders.get('accept-language')?.toLowerCase() || '';
  const htmlLang = savedLocale === 'en-US'
    ? 'en-US'
    : savedLocale === 'zh-CN'
      ? 'zh-CN'
      : acceptLang.startsWith('en')
        ? 'en-US'
        : 'zh-CN';
  const rssFeedPath = runtimeConfig.NEXT_PUBLIC_RSS_FEED_PATH;
  const atomFeedPath = runtimeConfig.NEXT_PUBLIC_ATOM_FEED_PATH;
  const localeInitScript = buildLocaleInitScript(runtimeConfig);

  return (
    <html lang={htmlLang}>
      <head>
        <link rel="alternate" type="application/rss+xml" href={rssFeedPath} title="RSS订阅" />
        <link rel="alternate" type="application/atom+xml" href={atomFeedPath} title="ATOM订阅" />
      </head>
      <body suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: localeInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <RuntimePublicConfigProvider initialConfig={runtimeConfig}>
          <I18nProvider>
            {shouldRenderPublicShell && <Header />}
            <main style={{ minHeight: '100vh' }}>
              {children}
            </main>
            {shouldRenderPublicShell && <ClientShell />}
          </I18nProvider>
        </RuntimePublicConfigProvider>
      </body>
    </html>
  );
}
