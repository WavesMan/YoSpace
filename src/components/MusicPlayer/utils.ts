import { Track } from './types';

/**
 * 格式化时间（秒 -> MM:SS）
 * @param seconds 秒数
 * @returns 格式化后的时间字符串
 */
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * 获取音轨的艺术家名称
 * @param track 音轨对象
 * @returns 艺术家名称字符串
 */
export const getArtists = (track: Track): string => {
  const artists = track.ar || track.artists || [];
  return artists.map(a => a.name).join(', ') || 'Unknown Artist';
};

const normalizeHttps = (url: string | null | undefined) => {
  if (!url) return '';
  if (url.startsWith('http://')) {
    return `https://${url.slice(7)}`;
  }
  return url;
};

/**
 * 获取音轨的封面图片URL
 * @param track 音轨对象
 * @returns 封面图片URL
 */
export const getCover = (track: Track): string => {
  return normalizeHttps(track.al?.picUrl || track.album?.picUrl || '');
};
