import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Common/Header/Header";
import Footer from "@/components/Common/Footer/Footer";
import { I18nProvider } from "@/context/I18nContext";

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_SITE_TITLE || "Weilai",
  description: "未来是未知的旅程，愿每一步前行，都有爱陪伴左右。",
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
        </I18nProvider>
      </body>
    </html>
  );
}
