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
  ar?: Artist[]; // API returns 'ar'
  artists?: Artist[]; // Sometimes 'artists'
  al?: Album; // API returns 'al'
  album?: Album; // Sometimes 'album'
  dt?: number; // Duration in ms
  duration?: number; // Alternative duration field
}

export type PlayMode = 'sequence' | 'random' | 'single';
