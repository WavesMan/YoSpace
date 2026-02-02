import { Track } from './types';

const PLAYLIST_ID = process.env.NEXT_PUBLIC_MUSIC_PLAYLIST_ID || '12752948320';
const ENV_BASE = process.env.NEXT_PUBLIC_MUSIC_API_BASE || 'https://netmusic.waveyo.cn/';
const CLEAN_ENV_BASE = ENV_BASE.replace(/\/$/, '');

// 当使用官方托管的 netmusic.waveyo.cn 时，优先通过站内代理路径，避免浏览器直接跨域请求导致 Failed to fetch
const BASE_URL = CLEAN_ENV_BASE === 'https://netmusic.waveyo.cn'
  ? '/api/music-proxy'
  : CLEAN_ENV_BASE;

export const fetchPlaylistData = async (): Promise<{ code: number; songs: Track[] }> => {
  try {
    const res = await fetch(`${BASE_URL}/playlist/track/all?id=${PLAYLIST_ID}`);
    const contentType = res.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
      const text = await res.text().catch(() => '');
      console.error('fetchPlaylistData non-JSON response', {
        status: res.status,
        body: text.slice(0, 200),
      });
      return { code: res.status || -1, songs: [] };
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error('fetchPlaylistData error', error);
    return { code: -1, songs: [] };
  }
};

/**
 * 检查歌曲是否可用
 * @param id 歌曲ID
 */
export const checkSongAvailability = async (id: number): Promise<boolean> => {
  try {
    const res = await fetch(`${BASE_URL}/check/music?id=${id}&timestamp=${Date.now()}`);
    const contentType = res.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
      const text = await res.text().catch(() => '');
      console.error('checkSongAvailability non-JSON response', {
        status: res.status,
        body: text.slice(0, 200),
      });
      return false;
    }

    const data = await res.json();
    return !!data.success;
  } catch (error) {
    console.error('checkSongAvailability error', error);
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
    const contentType = res.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
      const text = await res.text().catch(() => '');
      console.error('getSongUrl non-JSON response', {
        status: res.status,
        body: text.slice(0, 200),
      });
      return null;
    }

    const data = await res.json();
    if (data.code === 200 && data.data?.[0]?.url) {
      return data.data[0].url;
    }
    return null;
  } catch (error) {
    console.error('getSongUrl error', error);
    return null;
  }
};
