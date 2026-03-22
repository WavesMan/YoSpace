import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Pagination from '../Pagination';
import { I18nProvider } from '@/context/I18nContext';

const renderWithI18n = (node: React.ReactElement) => {
    return render(<I18nProvider>{node}</I18nProvider>);
};

describe('Pagination', () => {
    it('renders navigation labels', () => {
        renderWithI18n(
            <Pagination
                totalItems={100}
                itemsLimitPerPage={10}
                visiblePages={5}
                currentPage={2}
                handlePageChange={() => {}}
            />
        );
        expect(screen.getByRole('button', { name: '前往首页' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '上一页' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '下一页' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '末页' })).toBeInTheDocument();
    });

    it('calls handler when clicking page', async () => {
        const handlePageChange = vi.fn();
        const user = userEvent.setup();
        renderWithI18n(
            <Pagination
                totalItems={100}
                itemsLimitPerPage={10}
                visiblePages={5}
                currentPage={2}
                handlePageChange={handlePageChange}
            />
        );
        const pageButtons = screen.getAllByRole('button', { name: '前往第 3 页' });
        await user.click(pageButtons[0]);
        expect(handlePageChange).toHaveBeenCalledWith(3);
    });
});
