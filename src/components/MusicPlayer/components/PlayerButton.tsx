// 播放器按钮统一默认、悬停、按下、禁用、加载与键盘聚焦状态。
import type { ButtonHTMLAttributes } from 'react';
import { FiLoader } from 'react-icons/fi';
import styles from './PlayerButton.module.css';

interface PlayerButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingLabel?: string;
}

/** 加载时保留按钮尺寸、阻止再次触发，并向辅助技术报告忙碌状态。 */
export default function PlayerButton({
  children, className = '', loading = false, loadingLabel = '正在加载',
  disabled, type = 'button', ...props
}: PlayerButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={`${styles.button} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading}
      aria-label={loading ? loadingLabel : props['aria-label']}
      data-loading={loading}
    >
      <span className={styles.content} aria-hidden={loading || undefined}>{children}</span>
      {loading && <FiLoader className={styles.spinner} aria-hidden="true" />}
    </button>
  );
}
