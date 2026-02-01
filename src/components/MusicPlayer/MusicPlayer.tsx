"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './MusicPlayer.module.css';

// 类型
import { PlayMode } from './types';

// Hooks & Services
import { useAudio } from './hooks/useAudio';
import { usePlaylist } from './hooks/usePlaylist';

// 子组件
import PlayerHeader from './components/PlayerHeader';
import PlayerProgressBar from './components/PlayerProgressBar';
import PlayerControls from './components/PlayerControls';
import PlayerVolume from './components/PlayerVolume';
import PlayerPlaylist from './components/PlayerPlaylist';
import PlayerToggleButton from './components/PlayerToggleButton';

/**
 * 音乐播放器主组件
 * 
 * 职责：
 * 1. 协调 Audio 核心逻辑与播放列表逻辑
 * 2. 组装 UI 组件
 * 3. 处理组件层面的交互（如点击外部关闭、展开/收起动画）
 */
export default function MusicPlayer() {
  // --- UI State ---
  const [isOpen, setIsOpen] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- Logic Hooks ---
  const {
    audioRef,
    isPlaying,
    progress,
    duration,
    volume,
    error: audioError,
    togglePlay: toggleAudio,
    seek,
    setVolume,
    setDuration,
    setError: setAudioError
  } = useAudio();

  const {
    playlist,
    currentTrackIndex,
    currentTrack,
    mode,
    fetchPlaylist,
    handleNext: getNextIndex,
    handlePrev: getPrevIndex,
    handleReorder,
    prepareTrack,
    setCurrentTrackIndex,
    setMode,
    setIsLoading
  } = usePlaylist();

  // --- Combined Logic ---

  // 播放指定索引的歌曲
  const playTrack = useCallback(async (index: number) => {
    if (index < 0 || index >= playlist.length) return;

    // 更新索引
    setCurrentTrackIndex(index);
    localStorage.setItem('music_player_index', index.toString());
    
    setIsLoading(true);
    setAudioError(null);

    // 准备资源
    const { url, error } = await prepareTrack(index);
    
    if (error || !url) {
      setAudioError(error || '获取资源失败');
      setIsLoading(false);
      return;
    }

    // 播放
    await toggleAudio(url);
    setIsLoading(false);
  }, [playlist, prepareTrack, setCurrentTrackIndex, setAudioError, setIsLoading, toggleAudio]);

  // 切歌逻辑
  const handleNext = useCallback((auto = false) => {
    const nextIndex = getNextIndex(auto);
    
    // 如果是单曲循环且自动播放结束，只需重播
    if (mode === 'single' && auto && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      return;
    }

    if (nextIndex !== -1) {
      playTrack(nextIndex);
    }
  }, [getNextIndex, mode, audioRef, playTrack]);

  const handlePrev = useCallback(() => {
    const prevIndex = getPrevIndex();
    if (prevIndex !== -1) {
      playTrack(prevIndex);
    }
  }, [getPrevIndex, playTrack]);

  const handleTogglePlay = useCallback(() => {
    if (!audioRef.current?.src && playlist.length > 0) {
      // 如果没有源，尝试播放当前或第一首
      const idx = currentTrackIndex >= 0 ? currentTrackIndex : 0;
      playTrack(idx);
    } else {
      toggleAudio();
    }
  }, [audioRef, playlist, currentTrackIndex, playTrack, toggleAudio]);

  // --- Effects ---

  // 初始化加载
  useEffect(() => {
    fetchPlaylist();
  }, [fetchPlaylist]);

  // 更新时长（当 currentTrack 变化时，如果元数据中有 duration，优先使用）
  useEffect(() => {
    if (currentTrack) {
      const ms = currentTrack.dt || currentTrack.duration || 0;
      if (ms > 0) {
        setDuration(ms / 1000);
      }
    }
  }, [currentTrack, setDuration]);

  // 监听播放结束，自动下一曲
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onEnded = () => handleNext(true);
    audio.addEventListener('ended', onEnded);
    return () => audio.removeEventListener('ended', onEnded);
  }, [handleNext, audioRef]); // handleNext 依赖 mode/playlist，需确保最新

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowPlaylist(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // --- Render ---

  if (!playlist) return null;

  return (
    <motion.div 
      ref={containerRef}
      className={styles.container}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
            className={styles.player}
          >
            <PlayerHeader 
              currentTrack={currentTrack}
              onClose={() => setIsOpen(false)}
            />

            <PlayerProgressBar
              currentTime={progress}
              duration={duration}
              onSeek={seek} // seek 只是更新 UI 和 currentTime
              onSeekEnd={() => {}} // useAudio 的 seek 已经处理了
            />

            <div style={{ padding: '0 1rem 1rem 1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <PlayerControls 
                 isPlaying={isPlaying}
                 mode={mode}
                 showPlaylist={showPlaylist}
                 onTogglePlay={handleTogglePlay}
                 onNext={() => handleNext(false)}
                 onPrev={handlePrev}
                 onToggleMode={() => {
                   const modes: PlayMode[] = ['sequence', 'random', 'single'];
                   const next = modes[(modes.indexOf(mode) + 1) % modes.length];
                   setMode(next);
                 }}
                 onTogglePlaylist={() => setShowPlaylist(!showPlaylist)}
               />

               <PlayerVolume 
                 volume={volume}
                 onVolumeChange={setVolume}
                 onToggleMute={() => setVolume(volume === 0 ? 0.7 : 0)}
               />
            </div>

            {audioError && (
                <div className={styles.error}>
                    {audioError}
                </div>
            )}

            <PlayerPlaylist 
              showPlaylist={showPlaylist}
              playlist={playlist}
              currentTrackIndex={currentTrackIndex}
              isPlaying={isPlaying}
              onPlayTrack={playTrack}
              onReorder={handleReorder}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <PlayerToggleButton 
        isOpen={isOpen}
        isPlaying={isPlaying}
        onToggle={() => setIsOpen(!isOpen)}
      />
    </motion.div>
  );
}
