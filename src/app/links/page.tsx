import Links from "@/components/Links/Links";
import { Metadata } from "next";

// 链接页面
export const metadata: Metadata = {
  title: `Links - ${process.env.NEXT_PUBLIC_SITE_TITLE || 'YoSpace'}`,
  description: 'Friends and useful links',
};

// 链接页面
export default function LinksPage() {
  return <Links />;
}
