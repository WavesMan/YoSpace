import { pageMetadata } from "@/utils/seo";
import Links from "@/components/Links/Links";

// 链接页面
export const metadata = pageMetadata("/links", "友情链接", "浏览 WaveYo 的友情链接。");

// 链接页面
export default function LinksPage() {
  return <Links />;
}
