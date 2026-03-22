"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './MusicPlayer.module.css';

// 类型
import { PlayMode } from './types';

// Hooks & Services
import { useAudio } from './hooks/useAudio';
import { usePlaylist } from './hooks/usePlaylist';
import { fetchLyricData } from './services';
import { parseLrcLines, parseYrcLines, type LyricLine } from './utils';

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
  const playRequestIdRef = useRef(0);
  const preloadAudioRef = useRef<HTMLAudioElement | null>(null);
  const preloadRequestIdRef = useRef(0);
  const preloadedUrlRef = useRef<string | null>(null);
  const lyricLineRef = useRef('');
  const lyricNextLineRef = useRef('');
  const lyricLinesRef = useRef<LyricLine[]>([]);
  const lyricIndexRef = useRef(-1);
  const lyricRequestIdRef = useRef(0);
  const footerLyricRef = useRef<{
    line: string;
    nextLine: string;
    isPlaying: boolean;
    hasLyric: boolean;
  } | null>(null);

  // --- Logic Hooks ---
  const {
    audioRef,
    isPlaying,
    progress,
    duration,
    volume,
    error: audioError,
    playUrl,
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

    const requestId = (playRequestIdRef.current += 1);

    // 更新索引
    setCurrentTrackIndex(index);
    localStorage.setItem('music_player_index', index.toString());
    
    setIsLoading(true);
    setAudioError(null);

    // 准备资源
    const { url, error } = await prepareTrack(index);

    if (requestId !== playRequestIdRef.current) {
      return;
    }
    
    if (error || !url) {
      setAudioError(error || '获取资源失败');
      setIsLoading(false);
      return;
    }

    // 播放
    await playUrl(url);
    setIsLoading(false);
  }, [playlist, prepareTrack, setCurrentTrackIndex, setAudioError, setIsLoading, playUrl]);

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

  /**
   * 重置歌词状态，避免切歌残留
   *
   * 使用示例：
   * resetLyricState();
   *
   * @returns 无返回值
   */
  const resetLyricState = useCallback(() => {
    lyricLinesRef.current = [];
    lyricIndexRef.current = -1;
    lyricLineRef.current = '';
    lyricNextLineRef.current = '';
  }, []);

  /**
   * 向页脚派发歌词变更事件，避免重复派发
   *
   * 使用示例：
   * emitFooterLyricIfChanged({ line, nextLine, isPlaying, hasLyric });
   *
   * @param payload 页脚歌词事件载荷
   * @returns 无返回值
   */
  const emitFooterLyricIfChanged = useCallback((payload: {
    line: string;
    nextLine: string;
    isPlaying: boolean;
    hasLyric: boolean;
  }) => {
    if (typeof window === 'undefined') return;
    const prev = footerLyricRef.current;
    if (
      prev
      && prev.line === payload.line
      && prev.nextLine === payload.nextLine
      && prev.isPlaying === payload.isPlaying
      && prev.hasLyric === payload.hasLyric
    ) {
      return;
    }
    footerLyricRef.current = payload;
    window.dispatchEvent(new CustomEvent('music-lyric-update', { detail: payload }));
  }, []);

  /**
   * 根据时间戳定位当前歌词行索引
   *
   * 使用示例：
   * const index = resolveLyricIndex(lines, timeMs);
   *
   * @param lines 行级歌词数据
   * @param timeMs 当前播放时间（毫秒）
   * @returns 命中的行索引
   */
  const resolveLyricIndex = useCallback((lines: LyricLine[], timeMs: number) => {
    if (lines.length === 0) return -1;
    let left = 0;
    let right = lines.length - 1;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const target = lines[mid];
      if (timeMs < target.startMs) {
        right = mid - 1;
      } else if (timeMs >= target.endMs) {
        left = mid + 1;
      } else {
        return mid;
      }
    }
    return Math.min(left - 1, lines.length - 1);
  }, []);

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

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    preloadAudioRef.current = audio;
    return () => {
      audio.src = '';
      preloadAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (playlist.length === 0) return;
    const requestId = (preloadRequestIdRef.current += 1);
    const currentIndex = currentTrackIndex >= 0 ? currentTrackIndex : -1;
    const nextIndex = getNextIndex(false);
    const targets = [currentIndex, nextIndex].filter((value, index, array) => (
      value >= 0 && array.indexOf(value) === index
    ));

    const run = async () => {
      let nextUrl: string | null = null;
      for (const target of targets) {
        const { url } = await prepareTrack(target);
        if (requestId !== preloadRequestIdRef.current) {
          return;
        }
        if (target === nextIndex) {
          nextUrl = url;
        }
      }
      if (!nextUrl || requestId !== preloadRequestIdRef.current) {
        return;
      }
      if (preloadedUrlRef.current === nextUrl) {
        return;
      }
      preloadedUrlRef.current = nextUrl;
      if (preloadAudioRef.current) {
        preloadAudioRef.current.src = nextUrl;
        preloadAudioRef.current.load();
      }
    };

    run();
  }, [playlist.length, currentTrackIndex, getNextIndex, prepareTrack]);

  /**
   * 获取并解析歌词数据，逐字歌词优先
   *
   * 使用示例：
   * // currentTrack 变化时自动触发
   */
  useEffect(() => {
    if (!currentTrack?.id) {
      resetLyricState();
      emitFooterLyricIfChanged({
        line: '',
        nextLine: '',
        isPlaying: false,
        hasLyric: false,
      });
      return;
    }

    const requestId = (lyricRequestIdRef.current += 1);

    const run = async () => {
      const payload = await fetchLyricData(currentTrack.id);
      if (requestId !== lyricRequestIdRef.current) return;
      const yrcLines = parseYrcLines(payload.yrc);
      const lrcLines = yrcLines.length > 0 ? [] : parseLrcLines(payload.lrc);
      const parsedLines = yrcLines.length > 0 ? yrcLines : lrcLines;
      lyricLinesRef.current = parsedLines;
      lyricIndexRef.current = -1;
      lyricLineRef.current = '';
      lyricNextLineRef.current = '';
      if (parsedLines.length === 0) {
        emitFooterLyricIfChanged({
          line: '',
          nextLine: '',
          isPlaying: false,
          hasLyric: false,
        });
      }
    };

    run();
  }, [currentTrack?.id, emitFooterLyricIfChanged, resetLyricState]);

  /**
   * 根据播放进度刷新歌词行并同步页脚
   *
   * 使用示例：
   * // progress 变化时自动触发
   */
  useEffect(() => {
    const lines = lyricLinesRef.current;
    if (lines.length === 0) {
      emitFooterLyricIfChanged({
        line: '',
        nextLine: '',
        isPlaying,
        hasLyric: false,
      });
      return;
    }

    const timeMs = Math.max(0, Math.floor(progress * 1000));
    const index = resolveLyricIndex(lines, timeMs);
    if (index !== lyricIndexRef.current) {
      lyricIndexRef.current = index;
      lyricLineRef.current = index >= 0 ? lines[index]?.text || '' : '';
      lyricNextLineRef.current = index + 1 < lines.length ? lines[index + 1].text : '';
    }

    emitFooterLyricIfChanged({
      line: lyricLineRef.current,
      nextLine: lyricNextLineRef.current,
      isPlaying,
      hasLyric: true,
    });
  }, [isPlaying, progress, resolveLyricIndex, emitFooterLyricIfChanged]);

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
      data-player-root="true"
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
