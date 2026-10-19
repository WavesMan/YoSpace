import { configDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    test: {
        // 构建脚本使用 node:test 独立运行，不交给 Vitest 重复收集。
        exclude: [...configDefaults.exclude, 'scripts/**/*.test.mjs'],
        environment: 'jsdom',
        globals: false,
        setupFiles: ['./vitest.setup.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov'],
            include: ['src/**/*.{ts,tsx}'],
            exclude: ['src/**/*.d.ts'],
        },
    },
});
