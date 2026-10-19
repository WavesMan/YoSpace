import React, { useEffect, useState } from 'react';
import { CodeBlockFrame, PlainCodeContent, type CodeBlockProps } from '../PlainCodeBlock';
import { useViewportEntry } from './useViewportEntry';

const highlightedLanguages = new Set(['bash', 'shell', 'sh', 'go', 'javascript', 'js', 'typescript', 'ts', 'tsx', 'python', 'py', 'powershell', 'ps1', 'yaml', 'yml', 'json']);
let highlighter: Promise<typeof import('../CodeBlock')> | undefined;

export default function LazyCodeBlock(props: CodeBlockProps) {
    const { ref, entered } = useViewportEntry<HTMLDivElement>('600px 0px', highlightedLanguages.has(props.language));
    const [Component, setComponent] = useState<React.ComponentType<CodeBlockProps> | null>(null);
    const [revealed, setRevealed] = useState(false);
    useEffect(() => {
        if (!entered || !highlightedLanguages.has(props.language)) return;
        let active = true;
        highlighter ??= import('../CodeBlock').catch(error => { highlighter = undefined; throw error; });
        highlighter.then(module => { if (active) setComponent(() => module.HighlightedCodeContent); }).catch(() => {});
        return () => { active = false; };
    }, [entered, props.language]);
    return <div ref={ref} data-lazy-code={revealed && Component ? 'ready' : 'plain'}>
        <CodeBlockFrame {...props} onRevealComplete={() => setRevealed(true)}>
            {revealed && Component ? <Component {...props} /> : <PlainCodeContent value={props.value} />}
        </CodeBlockFrame>
    </div>;
}
