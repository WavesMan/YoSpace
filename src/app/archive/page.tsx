import { getInitialPosts } from '@/utils/content/initialPosts';
import { Metadata } from "next";
import Archive from "@/components/Blog/Archive";

export const metadata: Metadata = {
    title: `Archive - ${process.env.NEXT_PUBLIC_SITE_TITLE || "YoSpace"}`,
    description: "Archive of all posts grouped by year and month",
};

export const revalidate = 3600;

export default async function ArchivePage() {
    const initial = await getInitialPosts();
    return <Archive {...initial} />;
}

