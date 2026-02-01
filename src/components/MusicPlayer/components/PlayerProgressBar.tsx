import React from 'react';
import DraggableProgressBar from '../../Common/ProgressBar/DraggableProgressBar';
import { formatTime } from '../utils';
import styles from './PlayerProgressBar.module.css';

interface PlayerProgressBarProps {
  /** 当前播放时间（秒） */
  currentTime: number;
  /** 总时长（秒） */
  duration: number;
  /** 拖动过程中的回调 */
  onSeek: (value: number) => void;
  /** 拖动结束时的回调（实际触发跳转） */
  onSeekEnd: (value: number) => void;
}

/**
 * 播放进度条组件
 * 
 * 职责：
 * 1. 显示当前播放时间和总时长
 * 2. 提供可拖动的进度条用于调节播放进度
 */
const PlayerProgressBar: React.FC<PlayerProgressBarProps> = ({
  currentTime,
  duration,
  onSeek,
  onSeekEnd
}) => {
  return (
    <div className={styles.progressSection}>
      <div className={styles.times}>
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration || 0)}</span>
      </div>
      <DraggableProgressBar
        value={currentTime}
        max={duration || 100}
        onChange={onSeek}
        onChangeEnd={onSeekEnd}
        className={styles.progressBar}
      />
    </div>
  );
};

export default PlayerProgressBar;
