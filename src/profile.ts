export const profile: Profile = {
    sitename: "YoSpace",
    navTitle: "YoSpace",
    names: ["WaveYo", "Waves_Man"],
    description: "从群众出发，扎根群众。向前，无限进步",
    image: "/WaveYo.jpg",
    socialLinks: [],
};

export const links: LinkItem[] = [];

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
