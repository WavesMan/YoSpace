import { Metadata } from "next";
import SearchPage from "@/components/Blog/SearchPage";

export const metadata: Metadata = {
    title: `Search - ${process.env.NEXT_PUBLIC_SITE_TITLE || "YoSpace"}`,
    description: "Search posts on this site",
};

export const revalidate = 3600;

export default function SearchRoutePage() {
    return <SearchPage />;
}

