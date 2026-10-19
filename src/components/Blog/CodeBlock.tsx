"use client";

import React from 'react';
import type { SyntaxHighlighterProps } from 'react-syntax-highlighter';
import createElement from 'react-syntax-highlighter/dist/esm/create-element';
import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/prism-light';
import vscDarkPlus from 'react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import go from 'react-syntax-highlighter/dist/esm/languages/prism/go';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import powershell from 'react-syntax-highlighter/dist/esm/languages/prism/powershell';
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import { CodeBlockFrame, CodeLine, type CodeBlockProps } from './PlainCodeBlock';
import style from './CodeBlock.module.css';

// 只注册正文实际使用的语法，纯文本及未知语言直接显示，不自动猜测。
Object.entries({ bash, go, javascript, typescript, tsx, python, powershell, yaml, json })
    .forEach(([name, grammar]) => SyntaxHighlighter.registerLanguage(name, grammar));
const supportedLanguages = new Set(['bash', 'go', 'javascript', 'typescript', 'tsx', 'python', 'powershell', 'yaml', 'json']);
const languageAliases: Record<string, string> = { js: 'javascript', ts: 'typescript', sh: 'bash', shell: 'bash', yml: 'yaml', py: 'python', ps1: 'powershell' };

type HighlightNode = Parameters<typeof createElement>[0]['node'];
function withoutFinalNewline(node: HighlightNode): HighlightNode {
    if (node.type === 'text') return { ...node, value: String(node.value ?? '').replace(/\n$/, '') };
    if (!node.children?.length) return node;
    return { ...node, children: node.children.map((child, index, children) => index === children.length - 1 ? withoutFinalNewline(child) : child) };
}
const renderLines: NonNullable<SyntaxHighlighterProps['renderer']> = ({ rows, stylesheet, useInlineStyles }) => rows.map((row, index) =>
    <CodeLine key={index} number={index + 1}>{createElement({ node: withoutFinalNewline(row), stylesheet, useInlineStyles, key: index })}</CodeLine>
);

// NOTE: 代码高亮展示组件，用于在博客中渲染可复制的代码块
// 使用示例：
// <CodeBlock language="tsx" value={"const a = 1;"} />

// NOTE: 博客通用代码块组件，支持语法高亮与一键复制反馈
const CodeBlock: React.FC<CodeBlockProps> = ({ language, value }) => {
    return (
        <CodeBlockFrame language={language} value={value}>
            <HighlightedCodeContent language={language} value={value} />
        </CodeBlockFrame>
    );
};

export function HighlightedCodeContent({ language, value }: CodeBlockProps) {
    const resolvedLanguage = languageAliases[language] || language;
    return <div className={style.code_highlight_arrival}>
            <SyntaxHighlighter
                language={supportedLanguages.has(resolvedLanguage) ? resolvedLanguage : 'text'}
                style={vscDarkPlus}
                customStyle={{
                    margin: 0,
                    padding: '1.25rem',
                    background: 'transparent',
                    fontSize: '0.95rem',
                    lineHeight: '1.5',
                    fontFamily: 'var(--font-family-mono)',
                    whiteSpace: 'pre-wrap',
                    tabSize: 4,
                }}
                codeTagProps={{ style: { fontFamily: 'var(--font-family-mono)', fontSize: 'inherit', lineHeight: 'inherit', whiteSpace: 'pre-wrap' } }}
                showLineNumbers={false}
                wrapLines
                renderer={renderLines}
            >
                {value}
            </SyntaxHighlighter>
        </div>;
}

export default CodeBlock;
