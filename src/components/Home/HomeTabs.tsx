import React from "react";
import styles from "./HomeTabs.module.css";

type HomeTabItem = {
    id: string;
    label: string;
};

type HomeTabsProps = {
    items: HomeTabItem[];
    activeId: string;
    ariaLabel: string;
    onChange: (id: string) => void;
    isExpanded: boolean;
    onToggle: () => void;
};

const HomeTabs: React.FC<HomeTabsProps> = ({
    items,
    activeId,
    ariaLabel,
    onChange,
    isExpanded,
    onToggle,
}) => {
    const listId = "home-tabs-list";

    return (
        <div className={styles.home_tabs_container} data-expanded={isExpanded ? "true" : "false"}>
            <button
                type="button"
                className={styles.home_tabs_toggle}
                aria-expanded={isExpanded}
                aria-controls={listId}
                aria-label="切换分页"
                onClick={onToggle}
            >
                {isExpanded ? "◀" : "▶"}
            </button>
            <div id={listId} className={styles.home_tabs} role="tablist" aria-label={ariaLabel}>
                {items.map(item => {
                    const isActive = activeId === item.id;
                    return (
                        <button
                            key={item.id}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            className={isActive ? styles.home_tab_button_active : styles.home_tab_button}
                            onClick={() => onChange(item.id)}
                        >
                            {item.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default HomeTabs;
