"use client";

import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FaRegCopy, FaCheck } from 'react-icons/fa';
import style from './CodeBlock.module.css';

// NOTE: 代码高亮展示组件，用于在博客中渲染可复制的代码块
// 使用示例：
// <CodeBlock language="tsx" value={"const a = 1;"} />
interface CodeBlockProps {
    // NOTE: 代码语言标识，用于选择高亮语法（如 tsx、js、bash 等）
    language: string;
    // NOTE: 实际展示与复制的代码内容
    value: string;
}

// NOTE: 博客通用代码块组件，支持语法高亮与一键复制反馈
const CodeBlock: React.FC<CodeBlockProps> = ({ language, value }) => {
    const [copied, setCopied] = useState(false);

    // NOTE: 处理复制按钮点击，将代码写入剪贴板并短暂展示复制成功状态
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy!', err);
        }
    };

    return (
        <div className={style.code_wrapper}>
            <div className={style.code_header}>
                <span className={style.code_lang}>{language || 'text'}</span>
                <button
                    onClick={handleCopy}
                    className={style.copy_button}
                    aria-label="Copy code"
                >
                    {copied ? <FaCheck className={style.copy_icon_success} /> : <FaRegCopy className={style.copy_icon} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
            </div>
            <SyntaxHighlighter
                language={language}
                style={vscDarkPlus}
                customStyle={{
                    margin: 0,
                    padding: '1.25rem',
                    background: 'transparent',
                    fontSize: '0.95rem',
                    lineHeight: '1.5',
                }}
                showLineNumbers={true}
                wrapLongLines={true}
            >
                {value}
            </SyntaxHighlighter>
        </div>
    );
};

export default CodeBlock;
