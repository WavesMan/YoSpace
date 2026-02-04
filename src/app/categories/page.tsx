import { Metadata } from "next";
import CategoriesPage from "@/components/Blog/CategoriesPage";

export const metadata: Metadata = {
    title: `Categories - ${process.env.NEXT_PUBLIC_SITE_TITLE || "YoSpace"}`,
    description: "All categories of posts",
};

export const revalidate = 3600;

export default function CategoriesRoutePage() {
    return <CategoriesPage />;
}

