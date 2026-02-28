import { useState, useCallback, useRef } from 'react';
import { Track, PlayMode } from '../types';
import { fetchPlaylistData, checkSongAvailability, getSongUrl } from '../services';

interface UsePlaylistReturn {
  playlist: Track[];
  currentTrackIndex: number;
  currentTrack: Track | null;
  mode: PlayMode;
  isLoading: boolean;
  
  setPlaylist: (list: Track[]) => void;
  setCurrentTrackIndex: (index: number) => void;
  setMode: (mode: PlayMode) => void;
  setIsLoading: (loading: boolean) => void;
  
  fetchPlaylist: () => Promise<void>;
  handleNext: (auto?: boolean) => number; // 返回下一个索引，不直接播放，解耦
  handlePrev: () => number;
  handleReorder: (newPlaylist: Track[]) => void;
  
  // 辅助方法
  prepareTrack: (index: number) => Promise<{ url: string | null; error: string | null }>;
}

/**
 * 播放列表管理 Hook
 * 
 * 职责：
 * 1. 管理播放列表数据、当前索引、播放模式
 * 2. 处理上一曲/下一曲的索引计算
 * 3. 处理播放列表的获取和重排序
 * 4. 提供歌曲准备逻辑（检查可用性、获取URL）
 */
export const usePlaylist = (): UsePlaylistReturn => {
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(-1);
  const [mode, setMode] = useState<PlayMode>('sequence');
  const [isLoading, setIsLoading] = useState(false);
  const urlCacheRef = useRef<Map<number, string>>(new Map());
  const availabilityCacheRef = useRef<Map<number, boolean>>(new Map());

  const currentTrack = currentTrackIndex >= 0 && currentTrackIndex < playlist.length 
    ? playlist[currentTrackIndex] 
    : null;

  const fetchPlaylist = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchPlaylistData();
      if (data.code === 200 && data.songs) {
        urlCacheRef.current.clear();
        availabilityCacheRef.current.clear();
        setPlaylist(data.songs);
        
        // 恢复上次播放索引
        const savedIndex = localStorage.getItem('music_player_index');
        let initialIndex = -1;
        
        if (savedIndex) {
          const idx = parseInt(savedIndex, 10);
          if (idx >= 0 && idx < data.songs.length) {
            initialIndex = idx;
          }
        }
        
        // 默认第一首
        if (initialIndex === -1 && data.songs.length > 0) {
          initialIndex = 0;
        }
        
        if (initialIndex !== -1) {
          setCurrentTrackIndex(initialIndex);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 计算下一曲索引（纯逻辑，不副作用）
  const handleNext = useCallback((auto = false) => {
    if (playlist.length === 0) return -1;

    let nextIndex = currentTrackIndex;

    if (mode === 'single' && auto) {
      return currentTrackIndex; // 单曲循环
    } else if (mode === 'random') {
      nextIndex = Math.floor(Math.random() * playlist.length);
    } else {
      nextIndex = (currentTrackIndex + 1) % playlist.length;
    }

    return nextIndex;
  }, [playlist, currentTrackIndex, mode]);

  const handlePrev = useCallback(() => {
    if (playlist.length === 0) return -1;
    
    let prevIndex = currentTrackIndex;
    if (mode === 'random') {
       prevIndex = Math.floor(Math.random() * playlist.length);
    } else {
       prevIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    }
    return prevIndex;
  }, [playlist, currentTrackIndex, mode]);

  const handleReorder = useCallback((newPlaylist: Track[]) => {
    if (currentTrackIndex >= 0 && currentTrackIndex < playlist.length) {
      const currentTrackId = playlist[currentTrackIndex].id;
      const newIndex = newPlaylist.findIndex(t => t.id === currentTrackId);
      
      if (newIndex !== -1 && newIndex !== currentTrackIndex) {
        setCurrentTrackIndex(newIndex);
        localStorage.setItem('music_player_index', newIndex.toString());
      }
    }
    setPlaylist(newPlaylist);
  }, [playlist, currentTrackIndex]);

  // 准备歌曲资源
  const prepareTrack = useCallback(async (index: number) => {
    if (index < 0 || index >= playlist.length) {
      return { url: null, error: '无效索引' };
    }

    const track = playlist[index];

    // 1. 检查可用性
    const cachedAvailability = availabilityCacheRef.current.get(track.id);
    const isAvailable = cachedAvailability ?? await checkSongAvailability(track.id);
    availabilityCacheRef.current.set(track.id, isAvailable);
    if (!isAvailable) {
      return { url: null, error: `歌曲 "${track.name}" 暂不可用` };
    }

    // 2. 获取 URL
    const cachedUrl = urlCacheRef.current.get(track.id);
    if (cachedUrl) {
      return { url: cachedUrl, error: null };
    }
    const url = await getSongUrl(track.id);
    if (!url) {
      return { url: null, error: `无法获取 "${track.name}" 的播放链接` };
    }
    urlCacheRef.current.set(track.id, url);

    return { url, error: null };
  }, [playlist]);

  return {
    playlist,
    currentTrackIndex,
    currentTrack,
    mode,
    isLoading,
    setPlaylist,
    setCurrentTrackIndex,
    setMode,
    setIsLoading,
    fetchPlaylist,
    handleNext,
    handlePrev,
    handleReorder,
    prepareTrack
  };
};
