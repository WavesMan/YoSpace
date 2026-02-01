import socialLinksData from './data/socialLinks.json';

export const profile: Profile = {
    sitename: process.env.NEXT_PUBLIC_SITE_TITLE || "未来",
    navTitle: process.env.NEXT_PUBLIC_NAV_TITLE || "未来",
    names: process.env.NEXT_PUBLIC_PROFILE_NAMES?.split(',') || ["未来°", "这是未来呐", "这是未来呐"],
    description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || "未来是未知的旅程，愿每一步前行，都有爱陪伴左右。",
    image: process.env.NEXT_PUBLIC_PROFILE_IMAGE || "https://cravatar.com/avatar/23c51fce715e221bb371b4bd2437d8bc?s=512",
    socialLinks: socialLinksData
};

export const links: LinkItem[] = [
    {
        title: "KumaKorin",
        link: "https://korin.im",
        avatar: "https://m1.miaomc.cn/uploads/20210623_b735dde7c665d.jpeg"
    },
    {
        title: "PageGithub",
        subtitle: "Design by KumaKorin",
        link: "https://github.com/KumaKorin/react-homepage",
        avatar: "https://avatars.githubusercontent.com/u/49864285?v=4"
    }
];

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
