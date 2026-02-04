import { Metadata } from "next";
import TagDetail from "@/components/Blog/TagDetail";

export const metadata: Metadata = {
    title: `Tag - ${process.env.NEXT_PUBLIC_SITE_TITLE || "YoSpace"}`,
};

export const revalidate = 3600;

interface TagPageParams {
    slug: string;
}

export default async function TagPage({ params }: { params: Promise<TagPageParams> }) {
    const { slug } = await params;
    return <TagDetail slug={slug} />;
}

