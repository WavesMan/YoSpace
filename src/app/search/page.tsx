import { getInitialPosts } from '@/utils/content/initialPosts';
import { Metadata } from "next";
import SearchPage from "@/components/Blog/SearchPage";

export const metadata: Metadata = {
    title: `Search - ${process.env.NEXT_PUBLIC_SITE_TITLE || "YoSpace"}`,
    description: "Search posts on this site",
};

export const revalidate = 3600;

export default async function SearchRoutePage() {
    const initial = await getInitialPosts();
    return <SearchPage {...initial} />;
}

