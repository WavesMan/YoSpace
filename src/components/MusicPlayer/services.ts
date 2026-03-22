import { Track } from './types';

const PLAYLIST_ID = process.env.NEXT_PUBLIC_MUSIC_PLAYLIST_ID || '12752948320';
const ENV_BASE = process.env.NEXT_PUBLIC_MUSIC_API_BASE || 'https://netmusic.waveyo.cn/';
const CLEAN_ENV_BASE = ENV_BASE.replace(/\/$/, '');

// 当使用官方托管的 netmusic.waveyo.cn 时，优先通过站内代理路径，避免浏览器直接跨域请求导致 Failed to fetch
const BASE_URL = CLEAN_ENV_BASE === 'https://netmusic.waveyo.cn'
  ? '/api/music-proxy'
  : CLEAN_ENV_BASE;
const FALLBACK_BASE_URL = CLEAN_ENV_BASE;

const normalizeHttps = (url: string | null | undefined) => {
  if (!url) return null;
  if (url.startsWith('http://')) {
    return `https://${url.slice(7)}`;
  }
  return url;
};

export const fetchPlaylistData = async (): Promise<{ code: number; songs: Track[] }> => {
  try {
    const target = `${BASE_URL}/playlist/track/all?id=${PLAYLIST_ID}`;
    let res = await fetch(target);
    const shouldFallback = BASE_URL !== FALLBACK_BASE_URL
      && (res.status >= 300 && res.status < 400);
    if (shouldFallback) {
      res = await fetch(`${FALLBACK_BASE_URL}/playlist/track/all?id=${PLAYLIST_ID}`);
    }
    let contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json') && BASE_URL !== FALLBACK_BASE_URL) {
      const retryRes = await fetch(`${FALLBACK_BASE_URL}/playlist/track/all?id=${PLAYLIST_ID}`);
      res = retryRes;
      contentType = res.headers.get('content-type') || '';
    }

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
    const target = `${BASE_URL}/check/music?id=${id}&timestamp=${Date.now()}`;
    let res = await fetch(target);
    const shouldFallback = BASE_URL !== FALLBACK_BASE_URL
      && (res.status >= 300 && res.status < 400);
    if (shouldFallback) {
      res = await fetch(`${FALLBACK_BASE_URL}/check/music?id=${id}&timestamp=${Date.now()}`);
    }
    let contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json') && BASE_URL !== FALLBACK_BASE_URL) {
      const retryRes = await fetch(`${FALLBACK_BASE_URL}/check/music?id=${id}&timestamp=${Date.now()}`);
      res = retryRes;
      contentType = res.headers.get('content-type') || '';
    }

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
    const target = `${BASE_URL}/song/url/v1?id=${id}&level=exhigh&timestamp=${Date.now()}`;
    let res = await fetch(target);
    const shouldFallback = BASE_URL !== FALLBACK_BASE_URL
      && (res.status >= 300 && res.status < 400);
    if (shouldFallback) {
      res = await fetch(`${FALLBACK_BASE_URL}/song/url/v1?id=${id}&level=exhigh&timestamp=${Date.now()}`);
    }
    let contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json') && BASE_URL !== FALLBACK_BASE_URL) {
      const retryRes = await fetch(`${FALLBACK_BASE_URL}/song/url/v1?id=${id}&level=exhigh&timestamp=${Date.now()}`);
      res = retryRes;
      contentType = res.headers.get('content-type') || '';
    }

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
      return normalizeHttps(data.data[0].url);
    }
    return null;
  } catch (error) {
    console.error('getSongUrl error', error);
    return null;
  }
};

/**
 * 获取歌曲歌词（逐字优先、普通歌词兜底）
 *
 * 使用示例：
 * const lyric = await fetchLyricData(trackId);
 *
 * @param id 歌曲ID
 * @returns 歌词文本数据
 */
export const fetchLyricData = async (id: number): Promise<{ yrc: string; lrc: string }> => {
  const empty = { yrc: '', lrc: '' };
  try {
    const yrcTarget = `${BASE_URL}/lyric/new?id=${id}&timestamp=${Date.now()}`;
    let yrcRes = await fetch(yrcTarget);
    const shouldFallbackYrc = BASE_URL !== FALLBACK_BASE_URL
      && (yrcRes.status >= 300 && yrcRes.status < 400);
    if (shouldFallbackYrc) {
      yrcRes = await fetch(`${FALLBACK_BASE_URL}/lyric/new?id=${id}&timestamp=${Date.now()}`);
    }
    let yrcType = yrcRes.headers.get('content-type') || '';
    if (!yrcType.includes('application/json') && BASE_URL !== FALLBACK_BASE_URL) {
      const retryRes = await fetch(`${FALLBACK_BASE_URL}/lyric/new?id=${id}&timestamp=${Date.now()}`);
      yrcRes = retryRes;
      yrcType = yrcRes.headers.get('content-type') || '';
    }
    const yrcJson = yrcType.includes('application/json') ? await yrcRes.json().catch(() => null) : null;
    const yrcText = typeof yrcJson?.yrc?.lyric === 'string' ? yrcJson.yrc.lyric : '';

    if (yrcText) {
      return { yrc: yrcText, lrc: '' };
    }

    const lrcTarget = `${BASE_URL}/lyric?id=${id}&timestamp=${Date.now()}`;
    let lrcRes = await fetch(lrcTarget);
    const shouldFallbackLrc = BASE_URL !== FALLBACK_BASE_URL
      && (lrcRes.status >= 300 && lrcRes.status < 400);
    if (shouldFallbackLrc) {
      lrcRes = await fetch(`${FALLBACK_BASE_URL}/lyric?id=${id}&timestamp=${Date.now()}`);
    }
    let lrcType = lrcRes.headers.get('content-type') || '';
    if (!lrcType.includes('application/json') && BASE_URL !== FALLBACK_BASE_URL) {
      const retryRes = await fetch(`${FALLBACK_BASE_URL}/lyric?id=${id}&timestamp=${Date.now()}`);
      lrcRes = retryRes;
      lrcType = lrcRes.headers.get('content-type') || '';
    }
    const lrcJson = lrcType.includes('application/json') ? await lrcRes.json().catch(() => null) : null;
    const lrcText = typeof lrcJson?.lrc?.lyric === 'string' ? lrcJson.lrc.lyric : '';
    return { yrc: '', lrc: lrcText || '' };
  } catch (error) {
    console.error('fetchLyricData error', error);
    return empty;
  }
};
