import { Track } from './types';

const PLAYLIST_ID = process.env.NEXT_PUBLIC_MUSIC_PLAYLIST_ID || '12752948320';
const ENV_BASE = process.env.NEXT_PUBLIC_MUSIC_API_BASE || 'https://netmusic.waveyo.cn/';
const CLEAN_ENV_BASE = ENV_BASE.replace(/\/$/, '');
const BASE_URL = CLEAN_ENV_BASE;

/**
 * 获取播放列表数据
 */
export const fetchPlaylistData = async (): Promise<{ code: number; songs: Track[] }> => {
  const res = await fetch(`${BASE_URL}/playlist/track/all?id=${PLAYLIST_ID}`);
  return res.json();
};

/**
 * 检查歌曲是否可用
 * @param id 歌曲ID
 */
export const checkSongAvailability = async (id: number): Promise<boolean> => {
  try {
    const res = await fetch(`${BASE_URL}/check/music?id=${id}&timestamp=${Date.now()}`);
    const data = await res.json();
    return data.success;
  } catch {
    return false;
  }
};

/**
 * 获取歌曲播放链接
 * @param id 歌曲ID
 */
export const getSongUrl = async (id: number): Promise<string | null> => {
  try {
    const res = await fetch(`${BASE_URL}/song/url/v1?id=${id}&level=exhigh&timestamp=${Date.now()}`);
    const data = await res.json();
    if (data.code === 200 && data.data?.[0]?.url) {
      return data.data[0].url;
    }
    return null;
  } catch {
    return null;
  }
};
