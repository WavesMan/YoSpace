import PlayerButton from './PlayerButton';
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
  return (
    <div className={styles.volumeControl}>
      <PlayerButton
        onClick={onToggleMute}
        className={styles.iconBtn}
        aria-label={volume === 0 ? '恢复音量' : '静音'}
        aria-pressed={volume === 0}
      >
        {volume === 0 ? <FiVolumeX size={16} /> : <FiVolume2 size={16} />}
      </PlayerButton>
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
