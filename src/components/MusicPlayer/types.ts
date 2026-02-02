// NOTE: 音乐播放相关的基础类型定义，用于统一封装第三方接口字段
export interface Artist {
  name: string;
}

export interface Album {
  name: string;
  picUrl?: string;
}

export interface Track {
  id: number;
  name: string;
  // NOTE: 接口字段 ar，表示歌曲参与艺术家列表
  ar?: Artist[];
  // NOTE: 接口字段 artists，有些接口使用该字段表示艺术家列表
  artists?: Artist[];
  // NOTE: 接口字段 al，表示所属专辑信息
  al?: Album;
  // NOTE: 接口字段 album，有些接口使用该字段表示专辑信息
  album?: Album;
  // NOTE: 持续时长，单位毫秒
  dt?: number;
  // NOTE: 备用持续时长字段，单位毫秒
  duration?: number;
}

// NOTE: 播放模式：顺序播放、随机播放、单曲循环
export type PlayMode = 'sequence' | 'random' | 'single';
