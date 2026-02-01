"use client";

import React, { useEffect, useState } from 'react';

interface DynamicIconProps extends React.ComponentProps<'svg'> {
    packageName: string;
    iconName: string;
}

const DynamicIcon: React.FC<DynamicIconProps> = ({ packageName, iconName, ...props }) => {
    const [Icon, setIcon] = useState<React.ElementType | null>(null);

    useEffect(() => {
        if (!packageName || !iconName) return;

        let isMounted = true;

        const loadIcon = async () => {
            try {
                let module: any;
                // 显式列出所有支持的包以允许 Webpack 进行代码分割
                switch (packageName) {
                    case 'fa': module = await import('react-icons/fa'); break;
                    case 'fa6': module = await import('react-icons/fa6'); break;
                    case 'md': module = await import('react-icons/md'); break;
                    case 'bs': module = await import('react-icons/bs'); break;
                    case 'bi': module = await import('react-icons/bi'); break;
                    case 'ai': module = await import('react-icons/ai'); break;
                    case 'fi': module = await import('react-icons/fi'); break;
                    case 'gi': module = await import('react-icons/gi'); break;
                    case 'go': module = await import('react-icons/go'); break;
                    case 'gr': module = await import('react-icons/gr'); break;
                    case 'hi': module = await import('react-icons/hi'); break;
                    case 'hi2': module = await import('react-icons/hi2'); break;
                    case 'im': module = await import('react-icons/im'); break;
                    case 'io': module = await import('react-icons/io'); break;
                    case 'io5': module = await import('react-icons/io5'); break;
                    case 'lu': module = await import('react-icons/lu'); break;
                    case 'ri': module = await import('react-icons/ri'); break;
                    case 'si': module = await import('react-icons/si'); break;
                    case 'sl': module = await import('react-icons/sl'); break;
                    case 'tb': module = await import('react-icons/tb'); break;
                    case 'tfi': module = await import('react-icons/tfi'); break;
                    case 'ti': module = await import('react-icons/ti'); break;
                    case 'vsc': module = await import('react-icons/vsc'); break;
                    case 'wi': module = await import('react-icons/wi'); break;
                    case 'cg': module = await import('react-icons/cg'); break;
                    case 'ci': module = await import('react-icons/ci'); break;
                    case 'di': module = await import('react-icons/di'); break;
                    case 'fc': module = await import('react-icons/fc'); break;
                    case 'lia': module = await import('react-icons/lia'); break;
                    case 'pi': module = await import('react-icons/pi'); break;
                    case 'rx': module = await import('react-icons/rx'); break;
                    default: 
                        console.warn(`Icon package '${packageName}' is not supported yet.`);
                        return;
                }

                if (isMounted && module && module[iconName]) {
                    setIcon(() => module[iconName]);
                } else if (isMounted) {
                    console.warn(`Icon '${iconName}' not found in package '${packageName}'.`);
                }
            } catch (error) {
                if (isMounted) {
                    console.error(`Failed to load icon '${iconName}' from '${packageName}':`, error);
                }
            }
        };

        loadIcon();

        return () => {
            isMounted = false;
        };
    }, [packageName, iconName]);

    if (!Icon) {
        return null;
    }

    return <Icon {...props} />;
};

export default DynamicIcon;
