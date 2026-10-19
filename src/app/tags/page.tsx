import { getInitialPosts } from '@/utils/content/initialPosts';
import { Metadata } from "next";
import TagsPage from "@/components/Blog/TagsPage";

export const metadata: Metadata = {
    title: `Tags - ${process.env.NEXT_PUBLIC_SITE_TITLE || "YoSpace"}`,
    description: "All tags of posts",
};

export const revalidate = 3600;

export default async function TagsRoutePage() {
    const initial = await getInitialPosts();
    return <TagsPage {...initial} />;
}

