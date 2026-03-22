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

export interface LyricLine {
  startMs: number;
  endMs: number;
  text: string;
}

/**
 * 解析逐字歌词为行级时间轴
 *
 * 使用示例：
 * const lines = parseYrcLines(yrcText);
 *
 * @param rawYrc 逐字歌词原始文本
 * @returns 行级歌词数组
 */
export const parseYrcLines = (rawYrc: string): LyricLine[] => {
  if (!rawYrc) return [];
  const lines: LyricLine[] = [];
  const rows = rawYrc.split(/\r?\n/);
  rows.forEach((row) => {
    const trimmed = row.trim();
    if (!trimmed || trimmed.startsWith('{')) return;
    const match = trimmed.match(/^\[(\d+),(\d+)\](.*)$/);
    if (!match) return;
    const startMs = Number.parseInt(match[1], 10);
    const durationMs = Number.parseInt(match[2], 10);
    if (!Number.isFinite(startMs) || !Number.isFinite(durationMs)) return;
    const text = match[3]
      .replace(/\(\d+,\d+,\d+\)/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!text) return;
    lines.push({
      startMs,
      endMs: startMs + durationMs,
      text,
    });
  });
  return lines.sort((a, b) => a.startMs - b.startMs);
};

/**
 * 解析普通歌词为行级时间轴
 *
 * 使用示例：
 * const lines = parseLrcLines(lrcText);
 *
 * @param rawLrc 普通歌词原始文本
 * @returns 行级歌词数组
 */
export const parseLrcLines = (rawLrc: string): LyricLine[] => {
  if (!rawLrc) return [];
  const rows = rawLrc.split(/\r?\n/);
  const lines: LyricLine[] = [];
  const timeTag = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;
  rows.forEach((row) => {
    const text = row.replace(timeTag, '').trim();
    if (!text) return;
    let match: RegExpExecArray | null;
    timeTag.lastIndex = 0;
    while ((match = timeTag.exec(row)) !== null) {
      const minutes = Number.parseInt(match[1], 10);
      const seconds = Number.parseInt(match[2], 10);
      const millisRaw = match[3] || '0';
      const millis = Number.parseInt(millisRaw.padEnd(3, '0'), 10);
      const startMs = minutes * 60 * 1000 + seconds * 1000 + millis;
      if (!Number.isFinite(startMs)) continue;
      lines.push({ startMs, endMs: startMs + 5000, text });
    }
  });
  lines.sort((a, b) => a.startMs - b.startMs);
  for (let i = 0; i < lines.length - 1; i += 1) {
    if (lines[i + 1].startMs > lines[i].startMs) {
      lines[i].endMs = lines[i + 1].startMs;
    }
  }
  return lines;
};
