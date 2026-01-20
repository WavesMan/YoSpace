import Links from "@/components/Links/Links";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Links - Weilai",
  description: "友情链接页面",
};

export default function LinksPage() {
  return <Links />;
}
