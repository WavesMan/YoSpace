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
                let loadedModule: unknown;
                // 显式列出所有支持的包以允许 Webpack 进行代码分割
                switch (packageName) {
                    case 'fa': loadedModule = await import('react-icons/fa'); break;
                    case 'fa6': loadedModule = await import('react-icons/fa6'); break;
                    case 'md': loadedModule = await import('react-icons/md'); break;
                    case 'bs': loadedModule = await import('react-icons/bs'); break;
                    case 'bi': loadedModule = await import('react-icons/bi'); break;
                    case 'ai': loadedModule = await import('react-icons/ai'); break;
                    case 'fi': loadedModule = await import('react-icons/fi'); break;
                    case 'gi': loadedModule = await import('react-icons/gi'); break;
                    case 'go': loadedModule = await import('react-icons/go'); break;
                    case 'gr': loadedModule = await import('react-icons/gr'); break;
                    case 'hi': loadedModule = await import('react-icons/hi'); break;
                    case 'hi2': loadedModule = await import('react-icons/hi2'); break;
                    case 'im': loadedModule = await import('react-icons/im'); break;
                    case 'io': loadedModule = await import('react-icons/io'); break;
                    case 'io5': loadedModule = await import('react-icons/io5'); break;
                    case 'lu': loadedModule = await import('react-icons/lu'); break;
                    case 'ri': loadedModule = await import('react-icons/ri'); break;
                    case 'si': loadedModule = await import('react-icons/si'); break;
                    case 'sl': loadedModule = await import('react-icons/sl'); break;
                    case 'tb': loadedModule = await import('react-icons/tb'); break;
                    case 'tfi': loadedModule = await import('react-icons/tfi'); break;
                    case 'ti': loadedModule = await import('react-icons/ti'); break;
                    case 'vsc': loadedModule = await import('react-icons/vsc'); break;
                    case 'wi': loadedModule = await import('react-icons/wi'); break;
                    case 'cg': loadedModule = await import('react-icons/cg'); break;
                    case 'ci': loadedModule = await import('react-icons/ci'); break;
                    case 'di': loadedModule = await import('react-icons/di'); break;
                    case 'fc': loadedModule = await import('react-icons/fc'); break;
                    case 'lia': loadedModule = await import('react-icons/lia'); break;
                    case 'pi': loadedModule = await import('react-icons/pi'); break;
                    case 'rx': loadedModule = await import('react-icons/rx'); break;
                    default: 
                        console.warn(`Icon package '${packageName}' is not supported yet.`);
                        return;
                }

                const icons = loadedModule as Record<string, React.ElementType>;

                if (isMounted && icons && icons[iconName]) {
                    setIcon(() => icons[iconName]);
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
