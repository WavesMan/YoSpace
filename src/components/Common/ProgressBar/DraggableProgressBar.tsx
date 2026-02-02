"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
import styles from './DraggableProgressBar.module.css';

// NOTE: 可拖拽进度条组件，支持音量样式以及拖拽结束回调
// 使用示例：
// <DraggableProgressBar value={current} max={duration} onChange={setCurrent} />
interface DraggableProgressBarProps {
    // NOTE: 当前进度值，通常为已播放时长或音量值
    value: number;
    // NOTE: 最大进度值，用于计算百分比（例如总时长或最大音量）
    max: number;
    // NOTE: 拖拽过程中即时回调当前值
    onChange: (value: number) => void;
    // NOTE: 拖拽结束时触发的回调，可用于节流更新或发起请求
    onChangeEnd?: (value: number) => void;
    // NOTE: 自定义容器额外样式类名
    className?: string;
    // NOTE: 展示变体，volume 模式通常用于音量条
    variant?: 'default' | 'volume';
}

// NOTE: 支持鼠标与触摸事件的通用拖拽进度条组件
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

    // NOTE: 根据指针在容器中的横向位置计算对应数值，并限制在 0~max 范围
    const calculateValue = useCallback((clientX: number) => {
        if (!containerRef.current) return 0;
        
        const rect = containerRef.current.getBoundingClientRect();
        const offsetX = clientX - rect.left;
        const containerWidth = rect.width;

        // NOTE: 将比例限制在 0 和 1 之间，避免越界
        let ratio = offsetX / containerWidth;
        ratio = Math.max(0, Math.min(ratio, 1));
        
        return ratio * max;
    }, [max]);

    // NOTE: 开始拖拽时初始化状态并同步一次进度
    const handleStart = useCallback((clientX: number) => {
        setIsDragging(true);
        const newValue = calculateValue(clientX);
        setDragValue(newValue);
        onChange(newValue);
    }, [calculateValue, onChange]);

    // NOTE: 拖拽过程中根据指针位置持续更新进度
    const handleMove = useCallback((clientX: number) => {
        if (!isDragging) return;
        const newValue = calculateValue(clientX);
        setDragValue(newValue);
        onChange(newValue);
    }, [isDragging, calculateValue, onChange]);

    // NOTE: 结束拖拽时恢复状态并触发 onChangeEnd 回调
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

    // NOTE: 鼠标事件：按下时开始拖拽
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        // NOTE: 阻止事件冒泡，避免父级组件也响应拖拽
        e.stopPropagation();
        handleStart(e.clientX);
    };

    // NOTE: 触摸事件：在移动端开始拖拽
    const handleTouchStart = (e: React.TouchEvent) => {
        // NOTE: 阻止冒泡，避免父级滚动/拖拽组件冲突
        e.stopPropagation();
        handleStart(e.touches[0].clientX);
    };

    // NOTE: 注册全局事件，确保拖拽过程中移出组件区域时仍能正确结束
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
                // NOTE: 拖拽时根据触摸点位置更新进度
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
            // NOTE: 在容器层面拦截 pointer 事件，避免与父级拖拽行为冲突
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
