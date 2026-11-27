import { pageMetadata } from "@/utils/seo";
import Subscribe from "@/components/Subscribe/Subscribe";

export const metadata = pageMetadata("/subscribe", "订阅博客", "通过 RSS 或 Atom 订阅 WaveYo 最新技术文章。");

export const revalidate = 3600;

export default function SubscribePage() {
  return <Subscribe />;
}
