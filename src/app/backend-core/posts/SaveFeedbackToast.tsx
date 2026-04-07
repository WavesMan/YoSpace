'use client';

import { useEffect, useState } from 'react';
import styles from './SaveFeedbackToast.module.css';

interface SaveFeedbackToastProps {
  visible: boolean;
  title: string;
  description: string;
}

/**
 * 保存成功反馈弹窗
 *
 * 用于在编辑页提交成功后给出轻量反馈提示，支持自动消失与手动关闭。
 *
 * @param props 弹窗展示参数
 * @returns 反馈弹窗 JSX 节点
 */
function SaveFeedbackToast({ visible, title, description }: SaveFeedbackToastProps) {
  const [open, setOpen] = useState(visible);

  useEffect(() => {
    setOpen(visible);
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }
    const url = new URL(window.location.href);
    if (!url.searchParams.has('saved')) {
      return;
    }
    url.searchParams.delete('saved');
    window.history.replaceState({}, '', url.toString());
  }, [visible]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const timer = window.setTimeout(() => {
      setOpen(false);
    }, 2800);
    return () => {
      window.clearTimeout(timer);
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className={styles.toastContainer}>
      <div className={styles.toastCard} role="status" aria-live="polite">
        <div>
          <p className={styles.toastTitle}>{title}</p>
          <p className={styles.toastDescription}>{description}</p>
        </div>
        <button
          type="button"
          className={styles.toastClose}
          onClick={() => {
            setOpen(false);
          }}
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default SaveFeedbackToast;
