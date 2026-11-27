import React from 'react';
import Link from '../TransitionLink';
import style from './Pagination.module.css';
import { useI18n } from '@/context/I18nContext';

/**
 * 分页组件 Props 接口
 */
interface PaginationProps {
    totalItems: number; // 总条目数
    itemsLimitPerPage: number; // 每页显示的条目数
    visiblePages: number; // 总共显示的分页按钮数量
    currentPage: number; // 当前页码
    handlePageChange?: (page: number) => void;
    getPageHref?: (page: number) => string;
}

/**
 * Pagination 组件
 * 
 * 这是一个通用的分页组件，用于处理大量数据的分页显示。
 * 
 * 主要功能：
 * 1. 根据总条目数和每页限制计算总页数
 * 2. 动态计算显示的页码范围，保持当前页居中
 * 3. 提供首页、上一页、页码点击、下一页、末页的导航功能
 * 4. 只有一页时隐藏组件
 */
const Pagination: React.FC<PaginationProps> = ({ 
    totalItems, 
    itemsLimitPerPage, 
    currentPage, 
    visiblePages, 
    handlePageChange,
    getPageHref,
}) => {
    const { t } = useI18n();
    const totalPages = Math.ceil(totalItems / itemsLimitPerPage);

    // 如果总页数小于等于 1，则不渲染分页组件
    if (totalPages <= 1) {
        return null;
    }

    // 计算页码范围
    const halfVisible = Math.floor(visiblePages / 2);
    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, currentPage + halfVisible);

    // 调整范围以确保显示的页码数量等于 visiblePages（如果有足够的页数）
    if (endPage - startPage + 1 < visiblePages) {
        if (startPage === 1) {
            endPage = Math.min(totalPages, startPage + visiblePages - 1);
        } else if (endPage === totalPages) {
            startPage = Math.max(1, endPage - visiblePages + 1);
        }
    }

    // 生成页码数组
    const pages = Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);

    const control = (page: number, label: string, text: React.ReactNode, disabled = false, active = false) => {
        const className = `${style.pagination_pageButton}${active ? ` ${style.active}` : ''}`;
        const ariaCurrent = active ? 'page' : undefined;
        if (getPageHref && !disabled) {
            return <Link key={label} href={getPageHref(page)} className={className} aria-label={label} aria-current={ariaCurrent}>{text}</Link>;
        }
        return <button key={label} type="button" className={className} disabled={disabled} aria-label={label} aria-current={ariaCurrent} onClick={() => handlePageChange?.(page)}>
            {text}
        </button>;
    };

    return (
        <nav className={style.pagination_wrapper} aria-label="文章分页">
            <div className={style.pagination_container}>
                <div className={style.pagination}>
                    {control(1, '前往首页', t('Controller.Pagination.First'), currentPage === 1)}
                    {control(currentPage - 1, '上一页', t('Controller.Pagination.Previous'), currentPage === 1)}
                    {pages.map(page => control(page, `前往第 ${page} 页`, page, false, currentPage === page))}
                    {control(currentPage + 1, '下一页', t('Controller.Pagination.Next'), currentPage === totalPages)}
                    {control(totalPages, '末页', t('Controller.Pagination.End'), currentPage === totalPages)}
                </div>
            </div>
        </nav>
    );
};

export default Pagination;
