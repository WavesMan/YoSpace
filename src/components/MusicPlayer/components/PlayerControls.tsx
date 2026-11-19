import React from 'react';
import { 
  FiPlay, FiPause, FiSkipBack, FiSkipForward, 
  FiRepeat, FiList 
} from 'react-icons/fi';
import { BiShuffle } from 'react-icons/bi';
import { RiRepeatOneFill } from 'react-icons/ri';
import { PlayMode } from '../types';
import styles from './PlayerControls.module.css';
import PlayerButton from './PlayerButton';

export type PlaybackAction = 'play' | 'prev' | 'next' | 'track';

interface PlayerControlsProps {
  /** 是否正在播放 */
  isPlaying: boolean;
  /** 当前播放模式 */
  mode: PlayMode;
  /** 是否显示播放列表 */
  showPlaylist: boolean;
  disabled: boolean;
  pendingAction: PlaybackAction | null;
  isPlaylistLoading: boolean;
  isPlaylistFetching: boolean;
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
  disabled,
  pendingAction,
  isPlaylistLoading,
  isPlaylistFetching,
  onTogglePlay,
  onNext,
  onPrev,
  onToggleMode,
  onTogglePlaylist
}) => {
  return (
    <div className={styles.mainControls}>
      {/* 模式切换按钮 */}
      <PlayerButton
        onClick={onToggleMode}
        disabled={disabled || !!pendingAction}
        className={`${styles.iconBtn} ${mode !== 'sequence' ? styles.active : ''}`}
        title={`播放模式：${mode === 'sequence' ? '顺序播放' : mode === 'random' ? '随机播放' : '单曲循环'}`}
        aria-label="切换播放模式"
      >
        {mode === 'random' && <BiShuffle size={20} />}
        {mode === 'single' && <RiRepeatOneFill size={20} />}
        {mode === 'sequence' && <FiRepeat size={20} />}
      </PlayerButton>

      {/* 核心控制组 */}
      <div className={styles.btnGroup}>
        <PlayerButton onClick={onPrev} disabled={disabled || !!pendingAction} loading={pendingAction === 'prev'} loadingLabel="正在切换上一曲" className={styles.iconBtn} aria-label="上一曲">
          <FiSkipBack size={24} />
        </PlayerButton>
        <PlayerButton
          onClick={onTogglePlay} 
          disabled={disabled || !!pendingAction}
          loading={isPlaylistFetching || pendingAction === 'play' || pendingAction === 'track'}
          loadingLabel={isPlaylistFetching ? '正在加载歌单' : '正在准备播放'}
          className={styles.playBtn}
          aria-label={isPlaying ? '暂停' : '播放'}
        >
          {isPlaying ? <FiPause size={24} /> : <FiPlay size={24} fill="currentColor" />}
        </PlayerButton>
        <PlayerButton onClick={onNext} disabled={disabled || !!pendingAction} loading={pendingAction === 'next'} loadingLabel="正在切换下一曲" className={styles.iconBtn} aria-label="下一曲">
          <FiSkipForward size={24} />
        </PlayerButton>
      </div>

      {/* 播放列表切换按钮 */}
      <PlayerButton
        onClick={onTogglePlaylist}
        disabled={disabled}
        loading={isPlaylistLoading}
        loadingLabel="正在切换播放列表"
        aria-expanded={showPlaylist}
        className={`${styles.iconBtn} ${showPlaylist ? styles.active : ''}`}
        aria-label="切换播放列表"
      >
        <FiList size={20} />
      </PlayerButton>
    </div>
  );
};

export default PlayerControls;
