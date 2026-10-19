'use client';

import { usePageReadyTask } from '@/components/Common/PageReadiness';

/** Suspense 只登记等待，内容区域由同一过渡层覆盖。 */
export default function Loading() {
    usePageReadyTask(true);
    return null;
}
