import { Track } from './types';

const PLAYLIST_ID = process.env.NEXT_PUBLIC_MUSIC_PLAYLIST_ID || '12752948320';
const ENV_BASE = process.env.NEXT_PUBLIC_MUSIC_API_BASE || 'https://netmusic.waveyo.cn/';
// 所有音乐接口均由浏览器直连配置的源站。
const BASE_URL = ENV_BASE.replace(/\/$/, '');

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
    const res = await fetch(target);
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
    const target = `${BASE_URL}/check/music?id=${id}&timestamp=${Date.now()}`;
    const res = await fetch(target);
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

interface SongUrlResponse {
  code: number;
  data?: string | { url?: string | null; freeTrialInfo?: unknown }[];
}

// 两种歌曲链接接口均直连源站，单次失败不阻断后续音源匹配。
const fetchSongUrlResponse = async (path: string): Promise<SongUrlResponse | null> => {
  try {
    const target = `${BASE_URL}${path}`;
    const res = await fetch(target);
    const contentType = res.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
      console.warn('歌曲链接接口返回非 JSON 响应', {
        endpoint: path.split('?')[0],
        status: res.status,
      });
      return null;
    }

    const data: SongUrlResponse = await res.json();
    if (!res.ok || data?.code !== 200) {
      return null;
    }
    return data;
  } catch (error) {
    console.warn('歌曲链接请求或解析失败', {
      endpoint: path.split('?')[0],
      errorType: error instanceof Error ? error.name : '未知错误',
    });
    return null;
  }
};

/**
 * 获取完整歌曲播放链接；普通接口无链接、仅提供试听或请求失败时尝试匹配音源。
 * @param id 歌曲ID
 * @returns HTTPS 播放链接；两种解析均失败时返回 null，不返回试听片段。
 */
export const getSongUrl = async (id: number): Promise<string | null> => {
  const response = await fetchSongUrlResponse(`/song/url/v1?id=${id}&level=exhigh&timestamp=${Date.now()}`);
  const song = Array.isArray(response?.data) ? response.data[0] : null;
  if (typeof song?.url === 'string' && song.url && !song.freeTrialInfo) {
    return normalizeHttps(song.url);
  }

  // 匹配接口的 data 是 URL 字符串，与普通接口的歌曲数组结构不同。
  const matched = await fetchSongUrlResponse(`/song/url/match?id=${id}&timestamp=${Date.now()}`);
  return typeof matched?.data === 'string' ? normalizeHttps(matched.data) : null;
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
    const yrcRes = await fetch(yrcTarget);
    const yrcType = yrcRes.headers.get('content-type') || '';
    const yrcJson = yrcType.includes('application/json') ? await yrcRes.json().catch(() => null) : null;
    const yrcText = typeof yrcJson?.yrc?.lyric === 'string' ? yrcJson.yrc.lyric : '';

    if (yrcText) {
      return { yrc: yrcText, lrc: '' };
    }

    const lrcTarget = `${BASE_URL}/lyric?id=${id}&timestamp=${Date.now()}`;
    const lrcRes = await fetch(lrcTarget);
    const lrcType = lrcRes.headers.get('content-type') || '';
    const lrcJson = lrcType.includes('application/json') ? await lrcRes.json().catch(() => null) : null;
    const lrcText = typeof lrcJson?.lrc?.lyric === 'string' ? lrcJson.lrc.lyric : '';
    return { yrc: '', lrc: lrcText || '' };
  } catch (error) {
    console.error('fetchLyricData error', error);
    return empty;
  }
};
