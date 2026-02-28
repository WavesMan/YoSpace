import React from 'react';
import { FiVolume2, FiVolumeX } from 'react-icons/fi';
import DraggableProgressBar from '../../Common/ProgressBar/DraggableProgressBar';
import styles from './PlayerVolume.module.css';

interface PlayerVolumeProps {
  /** 当前音量 (0-1) */
  volume: number;
  /** 音量改变回调 */
  onVolumeChange: (value: number) => void;
  /** 静音/恢复切换回调 */
  onToggleMute: () => void;
}

/**
 * 音量控制组件
 * 
 * 职责：
 * 1. 显示和调节音量
 * 2. 提供静音切换
 */
const PlayerVolume: React.FC<PlayerVolumeProps> = ({
  volume,
  onVolumeChange,
  onToggleMute
}) => {
  const blurOnPointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.blur();
  };

  return (
    <div className={styles.volumeControl}>
      <button 
        onClick={onToggleMute}
        onPointerUp={blurOnPointerUp}
        className={styles.iconBtn}
        aria-label="Toggle mute"
      >
        {volume === 0 ? <FiVolumeX size={16} /> : <FiVolume2 size={16} />}
      </button>
      <DraggableProgressBar
        value={volume}
        max={1}
        onChange={onVolumeChange}
        variant="volume"
        className={styles.volumeBar}
      />
    </div>
  );
};

export default PlayerVolume;
