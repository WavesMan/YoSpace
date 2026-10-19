import React, { useRef, useState } from 'react';
import { FaRegCopy, FaCheck } from 'react-icons/fa';
import style from './CodeBlock.module.css';
import StreamingText, { finishStreamingWithin } from './Post/StreamingText';

export interface CodeBlockProps { language: string; value: string }

/** 轻量代码外壳与纯文本回退，不依赖语法高亮库。 */
export function CodeBlockFrame({ language, value, children, onRevealComplete }: CodeBlockProps & { children: React.ReactNode; onRevealComplete?: () => void }) {
    const [copied, setCopied] = useState(false);
    const frameRef = useRef<HTMLDivElement | null>(null);
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch (error) { console.error('复制代码失败：', error); }
    };
    return <div className={style.code_wrapper} ref={frameRef}
        onPointerDownCapture={() => finishStreamingWithin(frameRef.current)}
        onFocusCapture={() => finishStreamingWithin(frameRef.current)}>
        <div className={style.code_header}>
            <span className={style.code_lang}>{language || 'text'}</span>
            <button onClick={copy} className={style.copy_button} aria-label="Copy code">
                {copied ? <FaCheck className={style.copy_icon_success} /> : <FaRegCopy className={style.copy_icon} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
        </div>
        <StreamingText as="div" variant="code" onRevealComplete={onRevealComplete}>
            {children}
        </StreamingText>
    </div>;
}

export default function PlainCodeBlock(props: CodeBlockProps) {
    return <CodeBlockFrame {...props}>
        <PlainCodeContent value={props.value} />
    </CodeBlockFrame>;
}

export function CodeLine({ number, children }: { number: number; children: React.ReactNode }) {
    return <span className={`${style.code_line} ${style.code_line_content}`}>
        <span className={style.code_line_number} aria-hidden="true">{number}</span>
        {children}
    </span>;
}

export function PlainCodeContent({ value }: { value: string }) {
    return <pre className={style.code_plain}><code>{value.split('\n').map((line, index) =>
        <CodeLine key={index} number={index + 1}>{line}</CodeLine>
    )}</code></pre>;
}
