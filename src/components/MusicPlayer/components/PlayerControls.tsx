import React from 'react';
import { 
  FiPlay, FiPause, FiSkipBack, FiSkipForward, 
  FiRepeat, FiList 
} from 'react-icons/fi';
import { BiShuffle } from 'react-icons/bi';
import { RiRepeatOneFill } from 'react-icons/ri';
import { PlayMode } from '../types';
import styles from './PlayerControls.module.css';

interface PlayerControlsProps {
  /** 是否正在播放 */
  isPlaying: boolean;
  /** 当前播放模式 */
  mode: PlayMode;
  /** 是否显示播放列表 */
  showPlaylist: boolean;
  /** 播放/暂停切换 */
  onTogglePlay: () => void;
  /** 下一首 */
  onNext: () => void;
  /** 上一首 */
  onPrev: () => void;
  /** 切换播放模式 */
  onToggleMode: () => void;
  /** 切换播放列表显示 */
  onTogglePlaylist: () => void;
}

/**
 * 播放控制组件
 * 
 * 职责：
 * 1. 提供播放/暂停、上一首、下一首控制
 * 2. 提供播放模式切换（顺序、随机、单曲）
 * 3. 提供播放列表显隐切换
 */
const PlayerControls: React.FC<PlayerControlsProps> = ({
  isPlaying,
  mode,
  showPlaylist,
  onTogglePlay,
  onNext,
  onPrev,
  onToggleMode,
  onTogglePlaylist
}) => {
  return (
    <div className={styles.mainControls}>
      {/* 模式切换按钮 */}
      <button 
        onClick={onToggleMode}
        className={`${styles.iconBtn} ${mode !== 'sequence' ? styles.active : ''}`}
        title={`Mode: ${mode}`}
        aria-label="Toggle play mode"
      >
        {mode === 'random' && <BiShuffle size={20} />}
        {mode === 'single' && <RiRepeatOneFill size={20} />}
        {mode === 'sequence' && <FiRepeat size={20} />}
      </button>

      {/* 核心控制组 */}
      <div className={styles.btnGroup}>
        <button onClick={onPrev} className={styles.iconBtn} aria-label="Previous track">
          <FiSkipBack size={24} />
        </button>
        <button 
          onClick={onTogglePlay} 
          className={styles.playBtn}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <FiPause size={24} /> : <FiPlay size={24} fill="currentColor" />}
        </button>
        <button onClick={onNext} className={styles.iconBtn} aria-label="Next track">
          <FiSkipForward size={24} />
        </button>
      </div>

      {/* 播放列表切换按钮 */}
      <button 
        onClick={onTogglePlaylist}
        className={`${styles.iconBtn} ${showPlaylist ? styles.active : ''}`}
        aria-label="Toggle playlist"
      >
        <FiList size={20} />
      </button>
    </div>
  );
};

export default PlayerControls;
