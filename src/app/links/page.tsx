import Links from "@/components/Links/Links";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: `Links - ${process.env.NEXT_PUBLIC_SITE_TITLE || 'YoSpace'}`,
  description: 'Friends and useful links',
};

export default function LinksPage() {
  return <Links />;
}
