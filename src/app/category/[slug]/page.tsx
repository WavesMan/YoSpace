import { Metadata } from "next";
import CategoryDetail from "@/components/Blog/CategoryDetail";

export const metadata: Metadata = {
    title: `Category - ${process.env.NEXT_PUBLIC_SITE_TITLE || "YoSpace"}`,
};

export const revalidate = 3600;

interface CategoryPageParams {
    slug: string;
}

export default async function CategoryPage({ params }: { params: Promise<CategoryPageParams> }) {
    const { slug } = await params;
    return <CategoryDetail slug={slug} />;
}

