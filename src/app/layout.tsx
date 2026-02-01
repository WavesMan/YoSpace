import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Common/Header/Header";
import Footer from "@/components/Common/Footer/Footer";
import MusicPlayer from "@/components/MusicPlayer/MusicPlayer";
import { I18nProvider } from "@/context/I18nContext";

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_SITE_TITLE || "YoSpace",
  description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || "从群众出发，扎根群众。向前，无限进步",
  // icons 由 src/app/icon.tsx 自动生成，支持圆形裁剪
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <I18nProvider>
          <Header />
          <main style={{ minHeight: '100vh' }}>
            {children}
          </main>
          <Footer />
          <MusicPlayer />
        </I18nProvider>
      </body>
    </html>
  );
}
