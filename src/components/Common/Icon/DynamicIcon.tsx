import React from 'react';
import { FaGithub, FaBilibili, FaBluesky } from 'react-icons/fa6';
import { BsTwitterX } from 'react-icons/bs';
import { MdEmail } from 'react-icons/md';

// 社交图标按名称静态登记。react-icons 每个包是包含数千个具名导出的单文件 index，
// 运行时 `import('react-icons/<包>')` 会把整个图标库打成独立 chunk、使 tree-shaking 失效，
// 产出数十 MB 的客户端与 SSR 资源。新增图标时在此静态引入并登记，而非动态加载整包。
const commonIcons: Record<string, React.ElementType> = {
    'fa6:FaGithub': FaGithub,
    'fa6:FaBilibili': FaBilibili,
    'fa6:FaBluesky': FaBluesky,
    'bs:BsTwitterX': BsTwitterX,
    'md:MdEmail': MdEmail,
};

interface DynamicIconProps extends React.ComponentProps<'svg'> {
    packageName: string;
    iconName: string;
}

const DynamicIcon: React.FC<DynamicIconProps> = ({ packageName, iconName, ...props }) => {
    const ResolvedIcon = commonIcons[`${packageName}:${iconName}`];

    if (!ResolvedIcon) {
        return (
            <svg width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true" {...props}>
                <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
        );
    }

    return <ResolvedIcon {...props} />;
};

export default DynamicIcon;
