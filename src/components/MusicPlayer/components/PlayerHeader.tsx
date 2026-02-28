import Image from 'next/image';
import React from 'react';
import { FiX, FiMusic } from 'react-icons/fi';
import { Track } from '../types';
import { getArtists, getCover } from '../utils';
import styles from './PlayerHeader.module.css';

interface PlayerHeaderProps {
  /** 当前播放的曲目 */
  currentTrack: Track | null;
  /** 关闭播放器面板的回调 */
  onClose: () => void;
}

/**
 * 播放器头部组件
 * 
 * 职责：
 * 1. 显示当前歌曲信息（封面、歌名、歌手）
 * 2. 提供关闭播放器面板的按钮
 */
const PlayerHeader: React.FC<PlayerHeaderProps> = ({ currentTrack, onClose }) => {
  const blurOnPointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.blur();
  };

  return (
    <div className={styles.header}>
      <button 
        onClick={onClose}
        onPointerUp={blurOnPointerUp}
        className={styles.closeBtn}
        aria-label="Close player"
      >
        <FiX size={18} />
      </button>

      <div className={styles.trackInfo}>
        {/* 封面图占位或实际图片 */}
        <div className={styles.cover}>
          {currentTrack && getCover(currentTrack) ? (
            <Image 
              src={getCover(currentTrack)} 
              alt="Cover" 
              className={styles.coverImg}
              width={40}
              height={40}
            />
          ) : (
            <FiMusic size={24} />
          )}
        </div>
        
        {/* 歌曲元数据 */}
        <div className={styles.meta}>
          <h3 className={styles.title}>
            {currentTrack ? currentTrack.name : 'No Song Selected'}
          </h3>
          <p className={styles.artist}>
            {currentTrack ? getArtists(currentTrack) : 'Select a song'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlayerHeader;
