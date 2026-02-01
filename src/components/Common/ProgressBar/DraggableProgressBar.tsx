"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
import styles from './DraggableProgressBar.module.css';

interface DraggableProgressBarProps {
    value: number;
    max: number;
    onChange: (value: number) => void;
    onChangeEnd?: (value: number) => void;
    className?: string;
    variant?: 'default' | 'volume';
}

export default function DraggableProgressBar({
    value,
    max,
    onChange,
    onChangeEnd,
    className = '',
    variant = 'default'
}: DraggableProgressBarProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragValue, setDragValue] = useState<number | null>(null);

    const calculateValue = useCallback((clientX: number) => {
        if (!containerRef.current) return 0;
        
        const rect = containerRef.current.getBoundingClientRect();
        const offsetX = clientX - rect.left;
        const containerWidth = rect.width;
        
        // Clamp between 0 and 1
        let ratio = offsetX / containerWidth;
        ratio = Math.max(0, Math.min(ratio, 1));
        
        return ratio * max;
    }, [max]);

    const handleStart = useCallback((clientX: number) => {
        setIsDragging(true);
        const newValue = calculateValue(clientX);
        setDragValue(newValue);
        onChange(newValue);
    }, [calculateValue, onChange]);

    const handleMove = useCallback((clientX: number) => {
        if (!isDragging) return;
        const newValue = calculateValue(clientX);
        setDragValue(newValue);
        onChange(newValue);
    }, [isDragging, calculateValue, onChange]);

    const handleEnd = useCallback(() => {
        if (isDragging) {
            setIsDragging(false);
            const endValue = dragValue ?? value;
            if (onChangeEnd) {
                onChangeEnd(endValue);
            }
            setDragValue(null);
        }
    }, [isDragging, dragValue, value, onChangeEnd]);

    // Mouse Events
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent parent drag
        handleStart(e.clientX);
    };

    // Touch Events
    const handleTouchStart = (e: React.TouchEvent) => {
        e.stopPropagation(); // Prevent parent drag
        // e.preventDefault(); // Don't prevent default here to allow some gestures, but touch-action: none handles scrolling
        handleStart(e.touches[0].clientX);
    };

    // Global Event Listeners for Move/Up
    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                e.preventDefault();
                handleMove(e.clientX);
            }
        };

        const onMouseUp = () => {
            if (isDragging) {
                handleEnd();
            }
        };

        const onTouchMove = (e: TouchEvent) => {
            if (isDragging) {
                // e.preventDefault(); // Prevent scrolling
                handleMove(e.touches[0].clientX);
            }
        };

        const onTouchEnd = () => {
            if (isDragging) {
                handleEnd();
            }
        };

        if (isDragging) {
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
            document.addEventListener('touchmove', onTouchMove, { passive: false });
            document.addEventListener('touchend', onTouchEnd);
        }

        return () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            document.removeEventListener('touchmove', onTouchMove);
            document.removeEventListener('touchend', onTouchEnd);
        };
    }, [isDragging, handleMove, handleEnd]);

    const displayValue = isDragging ? (dragValue ?? value) : value;
    const percent = (displayValue / max) * 100;

    return (
        <div 
            ref={containerRef}
            className={`${styles.progressContainer} ${variant === 'volume' ? styles.volume : ''} ${className}`}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            // Stop propagation on the container itself to be safe
            onPointerDown={(e) => e.stopPropagation()}
        >
            <div className={styles.track}>
                <div 
                    className={styles.fill} 
                    style={{ width: `${percent}%` }}
                />
            </div>
            <div 
                className={styles.thumb} 
                style={{ left: `${percent}%` }}
            />
        </div>
    );
}
