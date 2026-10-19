'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';
import styles from './MarkdownImageLightbox.module.css';
import { resolveImageSharpenConfig } from './imageSharpenConfig';
import PostImage from './PostImage';

interface MarkdownImageLightboxProps {
    src: string;
    alt: string;
    width: number;
    height: number;
    className?: string;
    title?: string;
    unoptimized?: boolean;
}

interface Point {
    x: number;
    y: number;
}

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const MOVE_THRESHOLD = 6;
const MOUSE_LONG_PRESS_DELAY = 180;
const TOUCH_DOUBLE_TAP_DELAY = 280;
const DOUBLE_TAP_SCALE_LEVELS = [1, 2, 3, 4] as const;
const imageSharpenConfig = resolveImageSharpenConfig();
const imageSharpenStyle = {
    '--image-sharpen-contrast': imageSharpenConfig.contrast,
    '--image-sharpen-brightness': imageSharpenConfig.brightness,
} as React.CSSProperties;

const clamp = (value: number, min: number, max: number) => {
    return Math.min(max, Math.max(min, value));
};

const roundViewValue = (value: number) => {
    return Math.round(value * 1000) / 1000;
};

export const getPointerDistance = (first: Point, second: Point) => {
    return Math.hypot(second.x - first.x, second.y - first.y);
};

export const getLongPressDelay = (pointerType: string) => {
    return pointerType === 'touch' ? 0 : MOUSE_LONG_PRESS_DELAY;
};

const MarkdownImageLightbox: React.FC<MarkdownImageLightboxProps> = ({
    src,
    alt,
    width,
    height,
    className,
    title,
    unoptimized = false,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [scale, setScale] = useState(MIN_SCALE);
    const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const viewportRef = useRef<HTMLDivElement | null>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const closeButtonRef = useRef<HTMLButtonElement | null>(null);
    const triggerRef = useRef<HTMLImageElement | null>(null);
    const scaleRef = useRef(scale);
    const offsetRef = useRef(offset);
    const pointersRef = useRef(new Map<number, Point>());
    const longPressTimerRef = useRef<number | null>(null);
    const singleTapTimerRef = useRef<number | null>(null);
    const suppressClickUntilRef = useRef(0);
    const lastTouchTapRef = useRef(0);
    const lastPointerTypeRef = useRef('mouse');
    const doubleTapDirectionRef = useRef<1 | -1>(1);
    const gestureRef = useRef({
        startDistance: 0,
        startScale: MIN_SCALE,
        startOffset: { x: 0, y: 0 },
        startPoint: { x: 0, y: 0 },
        moved: false,
        hadMultiplePointers: false,
        canDrag: false,
        startedOnImage: false,
    });

    const clearLongPressTimer = useCallback(() => {
        if (longPressTimerRef.current === null) return;
        window.clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
    }, []);

    const clearSingleTapTimer = useCallback(() => {
        if (singleTapTimerRef.current === null) return;
        window.clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
    }, []);

    const resetView = useCallback(() => {
        scaleRef.current = MIN_SCALE;
        offsetRef.current = { x: 0, y: 0 };
        setScale(MIN_SCALE);
        setOffset({ x: 0, y: 0 });
        doubleTapDirectionRef.current = 1;
    }, []);

    const updateView = useCallback((nextScale: number, nextOffset = offsetRef.current) => {
        const limitedScale = roundViewValue(clamp(nextScale, MIN_SCALE, MAX_SCALE));
        const limitedOffset = limitedScale === MIN_SCALE
            ? { x: 0, y: 0 }
            : { x: roundViewValue(nextOffset.x), y: roundViewValue(nextOffset.y) };
        scaleRef.current = limitedScale;
        offsetRef.current = limitedOffset;
        setScale(limitedScale);
        setOffset(limitedOffset);
    }, []);

    const getScreenCenterOffset = useCallback((nextScale: number) => {
        const viewport = viewportRef.current;
        const image = imageRef.current;
        if (!viewport || !image) return offsetRef.current;

        const viewportRect = viewport.getBoundingClientRect();
        const imageRect = image.getBoundingClientRect();
        if (!imageRect.width || !imageRect.height || !image.offsetWidth || !image.offsetHeight) {
            const scaleRatio = nextScale / scaleRef.current;
            return {
                x: offsetRef.current.x * scaleRatio,
                y: offsetRef.current.y * scaleRatio,
            };
        }

        // 每次缩放前重新定位屏幕中心对应的图片点，并让该点在缩放后仍保持居中。
        const viewportCenterX = viewportRect.left + viewportRect.width / 2;
        const viewportCenterY = viewportRect.top + viewportRect.height / 2;
        const imagePointX = (viewportCenterX - imageRect.left) / imageRect.width - 0.5;
        const imagePointY = (viewportCenterY - imageRect.top) / imageRect.height - 0.5;
        return {
            x: -imagePointX * image.offsetWidth * nextScale,
            y: -imagePointY * image.offsetHeight * nextScale,
        };
    }, []);

    const openLightbox = (event: React.MouseEvent<HTMLImageElement>) => {
        event.preventDefault();
        event.stopPropagation();
        resetView();
        setIsOpen(true);
    };

    const closeLightbox = useCallback(() => {
        clearLongPressTimer();
        clearSingleTapTimer();
        pointersRef.current.clear();
        lastTouchTapRef.current = 0;
        setIsDragging(false);
        setIsOpen(false);
        resetView();
    }, [clearLongPressTimer, clearSingleTapTimer, resetView]);

    useEffect(() => {
        if (!isOpen) return;

        const previousOverflow = document.body.style.overflow;
        const triggerElement = triggerRef.current;
        document.body.style.overflow = 'hidden';
        closeButtonRef.current?.focus();

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                closeLightbox();
            }
        };
        const handleResize = () => {
            updateView(scaleRef.current, offsetRef.current);
        };

        document.addEventListener('keydown', handleKeyDown);
        window.addEventListener('resize', handleResize);

        return () => {
            document.body.style.overflow = previousOverflow;
            clearLongPressTimer();
            clearSingleTapTimer();
            document.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('resize', handleResize);
            triggerElement?.focus();
        };
    }, [clearLongPressTimer, clearSingleTapTimer, closeLightbox, isOpen, updateView]);

    const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLImageElement>) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        event.stopPropagation();
        resetView();
        setIsOpen(true);
    };

    const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        const step = event.deltaY > 0 ? -0.2 : 0.2;
        updateView(scaleRef.current + step);
    };

    const handleDoubleTapZoom = () => {
        const lastIndex = DOUBLE_TAP_SCALE_LEVELS.length - 1;
        let currentIndex = DOUBLE_TAP_SCALE_LEVELS.reduce((nearestIndex, level, index) => {
            const nearestDistance = Math.abs(DOUBLE_TAP_SCALE_LEVELS[nearestIndex] - scaleRef.current);
            return Math.abs(level - scaleRef.current) < nearestDistance ? index : nearestIndex;
        }, 0);

        if (currentIndex === lastIndex) doubleTapDirectionRef.current = -1;
        if (currentIndex === 0) doubleTapDirectionRef.current = 1;
        currentIndex = clamp(currentIndex + doubleTapDirectionRef.current, 0, lastIndex);

        const nextScale = DOUBLE_TAP_SCALE_LEVELS[currentIndex];
        if (currentIndex === lastIndex) doubleTapDirectionRef.current = -1;
        if (currentIndex === 0) doubleTapDirectionRef.current = 1;
        updateView(nextScale, getScreenCenterOffset(nextScale));
    };

    const handleTouchTap = (startedOnImage: boolean) => {
        if (!startedOnImage) {
            closeLightbox();
            return;
        }

        const now = Date.now();
        if (lastTouchTapRef.current && now - lastTouchTapRef.current <= TOUCH_DOUBLE_TAP_DELAY) {
            clearSingleTapTimer();
            lastTouchTapRef.current = 0;
            handleDoubleTapZoom();
            return;
        }

        lastTouchTapRef.current = now;
        clearSingleTapTimer();
        singleTapTimerRef.current = window.setTimeout(() => {
            lastTouchTapRef.current = 0;
            closeLightbox();
        }, TOUCH_DOUBLE_TAP_DELAY);
    };

    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if ((event.target as HTMLElement).closest('button')) return;
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        event.preventDefault();
        lastPointerTypeRef.current = event.pointerType || 'mouse';

        const point = { x: event.clientX, y: event.clientY };
        pointersRef.current.set(event.pointerId, point);
        if (typeof event.currentTarget.setPointerCapture === 'function') {
            event.currentTarget.setPointerCapture(event.pointerId);
        }

        if (pointersRef.current.size === 1) {
            const canDragImmediately = event.pointerType === 'touch' && scaleRef.current > MIN_SCALE;
            gestureRef.current = {
                startDistance: 0,
                startScale: scaleRef.current,
                startOffset: offsetRef.current,
                startPoint: point,
                moved: false,
                hadMultiplePointers: false,
                canDrag: canDragImmediately,
                startedOnImage: event.target === imageRef.current,
            };
            setIsDragging(canDragImmediately);

            clearLongPressTimer();
            if (event.pointerType === 'touch') return;
            longPressTimerRef.current = window.setTimeout(() => {
                if (pointersRef.current.size !== 1 || scaleRef.current <= MIN_SCALE) return;
                const currentPoint = pointersRef.current.get(event.pointerId);
                if (!currentPoint) return;
                gestureRef.current.startPoint = currentPoint;
                gestureRef.current.startOffset = offsetRef.current;
                gestureRef.current.canDrag = true;
                setIsDragging(true);
            }, getLongPressDelay(event.pointerType));
            return;
        }

        clearLongPressTimer();
        const [first, second] = Array.from(pointersRef.current.values());
        gestureRef.current.startDistance = getPointerDistance(first, second);
        gestureRef.current.startScale = scaleRef.current;
        gestureRef.current.startOffset = offsetRef.current;
        gestureRef.current.moved = true;
        gestureRef.current.hadMultiplePointers = true;
        gestureRef.current.canDrag = false;
        gestureRef.current.startedOnImage = false;
        setIsDragging(false);
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!pointersRef.current.has(event.pointerId)) return;
        event.preventDefault();

        const point = { x: event.clientX, y: event.clientY };
        pointersRef.current.set(event.pointerId, point);

        if (pointersRef.current.size >= 2) {
            const [first, second] = Array.from(pointersRef.current.values());
            const distance = getPointerDistance(first, second);
            const startDistance = gestureRef.current.startDistance;
            if (startDistance > 0) {
                const nextScale = gestureRef.current.startScale * (distance / startDistance);
                updateView(nextScale, gestureRef.current.startOffset);
            }
            return;
        }

        const deltaX = point.x - gestureRef.current.startPoint.x;
        const deltaY = point.y - gestureRef.current.startPoint.y;
        if (Math.hypot(deltaX, deltaY) >= MOVE_THRESHOLD) {
            gestureRef.current.moved = true;
        }
        if (scaleRef.current <= MIN_SCALE || !gestureRef.current.canDrag) return;
        updateView(scaleRef.current, {
            x: gestureRef.current.startOffset.x + deltaX,
            y: gestureRef.current.startOffset.y + deltaY,
        });
    };

    const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
        clearLongPressTimer();
        const shouldSuppressClick = gestureRef.current.moved || gestureRef.current.hadMultiplePointers;
        pointersRef.current.delete(event.pointerId);
        if (
            typeof event.currentTarget.hasPointerCapture === 'function'
            && event.currentTarget.hasPointerCapture(event.pointerId)
        ) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }

        if (shouldSuppressClick) {
            suppressClickUntilRef.current = Date.now() + 500;
        }

        const remainingPoint = Array.from(pointersRef.current.values())[0];
        if (remainingPoint) {
            gestureRef.current.startPoint = remainingPoint;
            gestureRef.current.startOffset = offsetRef.current;
            gestureRef.current.moved = true;
            gestureRef.current.canDrag = scaleRef.current > MIN_SCALE;
            setIsDragging(gestureRef.current.canDrag);
            return;
        }

        gestureRef.current.moved = false;
        gestureRef.current.hadMultiplePointers = false;
        gestureRef.current.canDrag = false;
        setIsDragging(false);

        if (event.pointerType === 'touch' && event.type === 'pointerup' && !shouldSuppressClick) {
            handleTouchTap(gestureRef.current.startedOnImage);
        }
    };

    const handleLightboxClick = (event: React.MouseEvent<HTMLDivElement>) => {
        event.stopPropagation();
        if ((event.target as HTMLElement).closest('button')) return;
        if (lastPointerTypeRef.current === 'touch') return;
        if (Date.now() < suppressClickUntilRef.current) {
            return;
        }
        closeLightbox();
    };

    const preview = isOpen ? (
        <div
            ref={viewportRef}
            className={styles.viewport}
            role="dialog"
            aria-modal="true"
            aria-label={alt ? `${alt} 图片预览` : '正文图片预览'}
            onClick={handleLightboxClick}
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
        >
            <button
                ref={closeButtonRef}
                type="button"
                className={styles.closeButton}
                onClick={(event) => {
                    event.stopPropagation();
                    closeLightbox();
                }}
                aria-label="关闭图片预览"
                title="关闭图片预览"
            >
                <FiX aria-hidden="true" />
            </button>
            <Image
                ref={imageRef}
                src={src}
                alt={alt}
                width={width}
                height={height}
                className={`${styles.sharpenImage} ${styles.previewImage} ${scale > MIN_SCALE ? styles.previewImageZoomed : ''} ${isDragging ? styles.previewImageDragging : ''}`.trim()}
                style={{
                    ...imageSharpenStyle,
                    transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
                }}
                draggable={false}
                priority
                unoptimized={unoptimized}
            />
        </div>
    ) : null;

    return (
        <>
            <PostImage
                ref={triggerRef}
                src={src}
                alt={alt}
                className={`${styles.sharpenImage} ${styles.triggerImage} ${className || ''}`.trim()}
                width={width}
                height={height}
                loading="lazy"
                title={title}
                unoptimized={unoptimized}
                role="button"
                tabIndex={0}
                aria-label={alt ? `查看大图：${alt}` : '查看正文图片大图'}
                style={imageSharpenStyle}
                onClick={openLightbox}
                onKeyDown={handleTriggerKeyDown}
            />
            {preview && typeof document !== 'undefined' ? createPortal(preview, document.body) : null}
        </>
    );
};

export default MarkdownImageLightbox;
