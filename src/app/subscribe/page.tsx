import { Metadata } from "next";
import Subscribe from "@/components/Subscribe/Subscribe";
import { getServerRuntimePublicConfig } from "@/server/runtime-config/public";

/**
 * 生成订阅页元信息。
 */
export async function generateMetadata(): Promise<Metadata> {
  const runtimeConfig = await getServerRuntimePublicConfig();
  return {
    title: `Subscribe - ${runtimeConfig.NEXT_PUBLIC_SITE_TITLE}`,
    description: "Subscribe to RSS and Atom feeds for the latest content updates",
  };
}

export const revalidate = 3600;

export default function SubscribePage() {
  return <Subscribe />;
}
