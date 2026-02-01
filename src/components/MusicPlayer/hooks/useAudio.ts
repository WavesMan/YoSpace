import { useState, useEffect, useMemo, useRef, useCallback, useSyncExternalStore } from 'react';

interface AudioState {
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  error: string | null;
}

interface UseAudioReturn extends AudioState {
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
  togglePlay: (url?: string | null) => Promise<void>;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setDuration: (duration: number) => void;
  setError: (error: string | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
}

/**
 * 音频核心逻辑 Hook
 * 
 * 职责：
 * 1. 管理 Audio 元素及其事件监听
 * 2. 管理播放进度、时长、音量
 * 3. 提供播放控制方法
 */
export const useAudio = (initialVolume: number = 0.7): UseAudioReturn => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const volumeStore = useMemo(() => {
    const key = 'music_player_volume';
    const clamp01 = (v: number) => Math.max(0, Math.min(v, 1));

    const snapshot = { value: clamp01(initialVolume) };
    const listeners = new Set<() => void>();

    const readFromStorage = () => {
      if (typeof window === 'undefined') return snapshot.value;
      const saved = window.localStorage.getItem(key);
      if (!saved) return snapshot.value;
      const parsed = Number.parseFloat(saved);
      if (!Number.isFinite(parsed)) return snapshot.value;
      snapshot.value = clamp01(parsed);
      return snapshot.value;
    };

    const emitChange = () => {
      listeners.forEach((listener) => listener());
    };

    return {
      subscribe(listener: () => void) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      getSnapshot() {
        return readFromStorage();
      },
      getServerSnapshot() {
        return clamp01(initialVolume);
      },
      set(nextVolume: number) {
        const clamped = clamp01(nextVolume);
        if (clamped === snapshot.value) return;
        snapshot.value = clamped;
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, clamped.toString());
        }
        emitChange();
      },
    };
  }, [initialVolume]);

  const volume = useSyncExternalStore(
    volumeStore.subscribe,
    volumeStore.getSnapshot,
    volumeStore.getServerSnapshot
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem('music_player_volume');
    if (!saved) return;
    const parsed = Number.parseFloat(saved);
    if (!Number.isFinite(parsed)) return;
    volumeStore.set(parsed);
  }, [volumeStore]);

  // 初始化 Audio
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = volume;
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 同步音量
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const setVolume = useCallback((v: number) => {
    volumeStore.set(v);
  }, [volumeStore]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  }, []);

  const togglePlay = useCallback(async (url?: string | null) => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // 如果有新的 URL 传入，则先设置
      if (url && audioRef.current.src !== url) {
        audioRef.current.src = url;
      }
      
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (e) {
        console.error("Playback failed", e);
        setIsPlaying(false);
        setError("播放失败");
      }
    }
  }, [isPlaying]);

  // 事件监听在组件层通过 useEffect 绑定，或者在这里绑定
  // 为了更好的控制，我们在 Hook 内部绑定核心事件，但允许外部传入回调
  // 这里简化为 Hook 内部管理状态，外部通过 props/effects 监听变化有点复杂
  // 我们选择在 Hook 内部处理所有 Audio 事件，将状态暴露出去

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setProgress(audio.currentTime);
      localStorage.setItem('music_player_progress', audio.currentTime.toString());
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleError = () => {
      setIsPlaying(false);
      setError("Playback error");
    };

    // 'ended' 事件通常需要触发切歌，这涉及播放列表逻辑
    // 所以我们不在这里处理 'ended'，而是让使用方通过 ref 监听，或者提供回调
    // 但为了解耦，我们只管理单纯的播放状态。
    // 更好的方式是：Hooks 接受 onEnded 回调
    
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  return {
    audioRef,
    isPlaying,
    progress,
    duration,
    volume,
    error,
    togglePlay,
    seek,
    setVolume,
    setDuration,
    setError,
    setIsPlaying
  };
};
