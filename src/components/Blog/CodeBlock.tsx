"use client";

import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FaRegCopy, FaCheck } from 'react-icons/fa';
import style from './CodeBlock.module.css';

interface CodeBlockProps {
    language: string;
    value: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, value }) => {
    const [copied, setCopied] = useState(false);

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
                    background: 'transparent', // Let container bg handle it
                    fontSize: '0.95rem',
                    lineHeight: '1.5'
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
