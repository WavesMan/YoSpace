import { Metadata } from "next";
import TagsPage from "@/components/Blog/TagsPage";

export const metadata: Metadata = {
    title: `Tags - ${process.env.NEXT_PUBLIC_SITE_TITLE || "YoSpace"}`,
    description: "All tags of posts",
};

export const revalidate = 3600;

export default function TagsRoutePage() {
    return <TagsPage />;
}

