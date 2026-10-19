'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Footer from './Footer/Footer';

const MusicPlayer = dynamic(() => import('@/components/MusicPlayer/MusicPlayer'), { ssr: false, loading: () => null });

export default function ClientShell() {
    const [idle, setIdle] = useState(false);
    useEffect(() => {
        if (typeof window.requestIdleCallback === 'function') {
            const handle = window.requestIdleCallback(() => setIdle(true), { timeout: 2000 });
            return () => window.cancelIdleCallback(handle);
        }
        const handle = setTimeout(() => setIdle(true), 0);
        return () => clearTimeout(handle);
    }, []);
    return <><Footer />{idle && <MusicPlayer />}</>;
}
