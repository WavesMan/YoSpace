import socialLinksData from './data/socialLinks.json';
import friendLinksData from './data/friendLinks.json';

export const profile: Profile = {
    sitename: process.env.NEXT_PUBLIC_SITE_TITLE || "YoSpace",
    navTitle: process.env.NEXT_PUBLIC_NAV_TITLE || "YoSpace",
    names: process.env.NEXT_PUBLIC_PROFILE_NAMES?.split(',') || ["WaveYo", "Waves_Man"],
    description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || "从群众出发，扎根群众。向前，无限进步",
    image: process.env.NEXT_PUBLIC_PROFILE_IMAGE || "/WaveYo.jpg",
    socialLinks: socialLinksData
};

export const links: LinkItem[] = friendLinksData;

export interface SocialLink {
    name: string;
    url: string;
    iconUrl?: string;
    iconPackage?: string;
    iconName?: string;
}

export interface Profile {
    sitename: string;
    navTitle: string;
    names: string[];
    description: string;
    image: string;
    socialLinks: SocialLink[];
}

export interface LinkItem {
    title: string;
    avatar: string;
    subtitle?: string;
    link: string;
}
