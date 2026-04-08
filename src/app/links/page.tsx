import Links from "@/components/Links/Links";
import { Metadata } from "next";
import { getServerRuntimePublicConfig } from "@/server/runtime-config/public";

// 链接页面
export async function generateMetadata(): Promise<Metadata> {
  const config = await getServerRuntimePublicConfig();
  return {
    title: `Links - ${config.NEXT_PUBLIC_SITE_TITLE}`,
    description: "Friends and useful links",
  };
}

// 链接页面
export default function LinksPage() {
  return <Links />;
}
