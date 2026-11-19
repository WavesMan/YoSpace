import PlayerButton from './PlayerButton';
import React from 'react';
import { FiMusic, FiX } from 'react-icons/fi';
import styles from './PlayerToggleButton.module.css';

interface PlayerToggleButtonProps {
  /** 播放器是否展开 */
  isOpen: boolean;
  /** 是否正在播放 */
  isPlaying: boolean;
  /** 切换展开状态的回调 */
  onToggle: () => void;
}

/**
 * 播放器悬浮开关按钮
 * 
 * 职责：
 * 1. 提供播放器展开/折叠的入口
 * 2. 播放时显示旋转动画
 */
const PlayerToggleButton: React.FC<PlayerToggleButtonProps> = ({
  isOpen,
  isPlaying,
  onToggle
}) => {
  return (
    <PlayerButton
      onClick={onToggle}
      className={`${styles.toggleBtn} ${isOpen ? styles.open : ''} ${isPlaying && !isOpen ? styles.spinning : ''}`}
      aria-label={isOpen ? '关闭播放器' : '打开播放器'}
      aria-expanded={isOpen}
    >
      {isOpen ? <FiX size={24} /> : <FiMusic size={24} />}
    </PlayerButton>
  );
};

export default PlayerToggleButton;
