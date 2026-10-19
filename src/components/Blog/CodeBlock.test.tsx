import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PlainCodeContent } from './PlainCodeBlock';
import { HighlightedCodeContent } from './CodeBlock';

describe('代码高亮与纯文本的稳定行布局', () => {
    it.each([
        'echo 中文👨‍👩‍👧',
        'first\n\nthird\n',
        'dism /online /get-features /format:table | Select-String "VirtualMachinePlatform|Microsoft-Windows-Subsystem-Linux|HypervisorPlatform"',
    ])('保持行数、空行和源代码内容：%s', value => {
        const { container } = render(<><PlainCodeContent value={value} /><HighlightedCodeContent language="powershell" value={value} /></>);
        const blocks = [...container.querySelectorAll('pre code')];
        expect(blocks).toHaveLength(2);
        for (const block of blocks) {
            const lines = [...block.children].map(row => {
                const copy = row.cloneNode(true) as Element;
                copy.querySelectorAll('[aria-hidden="true"]').forEach(number => number.remove());
                return copy.textContent;
            });
            expect(lines).toEqual(value.split('\n'));
        }
    });
});
