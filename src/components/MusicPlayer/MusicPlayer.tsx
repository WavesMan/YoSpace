"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiMusic, FiPlay, FiPause, FiSkipBack, FiSkipForward, 
  FiRepeat, FiList, FiX, FiVolume2, FiVolumeX 
} from 'react-icons/fi';
import { BiShuffle } from 'react-icons/bi';
import { RiRepeatOneFill } from 'react-icons/ri';
import styles from './MusicPlayer.module.css';

// --- Types ---

interface Artist {
  name: string;
}

interface Album {
  name: string;
  picUrl?: string;
}

interface Track {
  id: number;
  name: string;
  ar?: Artist[]; // API returns 'ar'
  artists?: Artist[]; // Sometimes 'artists'
  al?: Album; // API returns 'al'
  album?: Album; // Sometimes 'album'
  dt?: number; // Duration in ms
  duration?: number; // Alternative duration field
}

type PlayMode = 'sequence' | 'random' | 'single';

const PLAYLIST_ID = process.env.NEXT_PUBLIC_MUSIC_PLAYLIST_ID || '12752948320';
const ENV_BASE = process.env.NEXT_PUBLIC_MUSIC_API_BASE || 'https://netmusic.waveyo.cn/';
// Remove trailing slash if present
const CLEAN_ENV_BASE = ENV_BASE.replace(/\/$/, '');
// Use local proxy if utilizing the default external API to avoid CORS issues
const BASE_URL = CLEAN_ENV_BASE === 'https://netmusic.waveyo.cn' 
  ? '/api/music-proxy' 
  : CLEAN_ENV_BASE;

// --- Helper Functions ---

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// --- Component ---

export default function MusicPlayer() {
  // --- State ---
  const [isOpen, setIsOpen] = useState(false);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<PlayMode>('sequence');
  const [volume, setVolume] = useState(0.7);
  const [progress, setProgress] = useState(0); // Current time in seconds
  const [duration, setDuration] = useState(0); // Duration in seconds
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Refs ---
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- API Calls ---

  const fetchPlaylist = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${BASE_URL}/playlist/track/all?id=${PLAYLIST_ID}`);
      const data = await res.json();
      if (data.code === 200 && data.songs) {
        setPlaylist(data.songs);
        // Load saved state from localStorage if available
        const savedIndex = localStorage.getItem('music_player_index');
        let initialIndex = -1;
        
        if (savedIndex) {
          const idx = parseInt(savedIndex, 10);
          if (idx >= 0 && idx < data.songs.length) {
            initialIndex = idx;
          }
        }
        
        // If no valid saved index, default to the first song if available
        if (initialIndex === -1 && data.songs.length > 0) {
          initialIndex = 0;
        }
        
        if (initialIndex !== -1) {
          setCurrentTrackIndex(initialIndex);
        }
      } else {
        setError('Failed to load playlist');
      }
    } catch (err) {
      setError('Network error loading playlist');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkSongAvailability = async (id: number): Promise<boolean> => {
    try {
      const res = await fetch(`${BASE_URL}/check/music?id=${id}&timestamp=${Date.now()}`);
      const data = await res.json();
      return data.success;
    } catch {
      return false;
    }
  };

  const getSongUrl = async (id: number): Promise<string | null> => {
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

  // --- Playback Logic ---

  const currentTrack = useMemo(() => {
    return currentTrackIndex >= 0 && currentTrackIndex < playlist.length 
      ? playlist[currentTrackIndex] 
      : null;
  }, [playlist, currentTrackIndex]);

  // Update duration from metadata when track changes
  useEffect(() => {
    if (currentTrack) {
      const ms = currentTrack.dt || currentTrack.duration || 0;
      if (ms > 0) {
        setDuration(ms / 1000);
      }
    }
  }, [currentTrack]);

  const playTrack = useCallback(async (index: number) => {
    if (index < 0 || index >= playlist.length) return;
    
    // Save current index
    setCurrentTrackIndex(index);
    localStorage.setItem('music_player_index', index.toString());
    
    const track = playlist[index];
    setIsLoading(true);
    setError(null);

    // 1. Check availability
    const isAvailable = await checkSongAvailability(track.id);
    if (!isAvailable) {
      setError(`Song "${track.name}" is unavailable.`);
      setIsLoading(false);
      return;
    }

    // 2. Get URL
    const url = await getSongUrl(track.id);
    if (!url) {
      setError(`Could not get URL for "${track.name}".`);
      setIsLoading(false);
      return;
    }

    if (audioRef.current) {
      audioRef.current.src = url;
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (e) {
        console.error("Playback failed", e);
        setIsPlaying(false);
      }
    }
    setIsLoading(false);
  }, [playlist]);

  // Initial Load
  useEffect(() => {
    fetchPlaylist();
    // Initialize audio element
    audioRef.current = new Audio();
    audioRef.current.volume = volume;
    
    // Restore volume
    const savedVolume = localStorage.getItem('music_player_volume');
    if (savedVolume) {
      const v = parseFloat(savedVolume);
      setVolume(v);
      if (audioRef.current) audioRef.current.volume = v;
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [fetchPlaylist]); // eslint-disable-line react-hooks/exhaustive-deps

  // Audio Event Listeners
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

    const handleEnded = () => {
      handleNext(true); // Auto next
    };

    const handleError = () => {
      setIsPlaying(false);
      setError("Playback error");
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [mode, playlist, currentTrackIndex]); // Dependencies for handleNext

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      localStorage.setItem('music_player_volume', volume.toString());
    }
  }, [volume]);

  // --- Controls ---

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
        // If no source, try to play current track or first track
        if (!audioRef.current.src && playlist.length > 0) {
             const idx = currentTrackIndex >= 0 ? currentTrackIndex : 0;
             playTrack(idx);
        } else {
             audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
        }
    }
  };

  const handleNext = useCallback((auto = false) => {
    if (playlist.length === 0) return;

    let nextIndex = currentTrackIndex;

    if (mode === 'single' && auto) {
      // Replay same song
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
      return;
    } else if (mode === 'random') {
      nextIndex = Math.floor(Math.random() * playlist.length);
    } else {
      // Sequence
      nextIndex = (currentTrackIndex + 1) % playlist.length;
    }

    playTrack(nextIndex);
  }, [playlist, currentTrackIndex, mode, playTrack]);

  const handlePrev = () => {
    if (playlist.length === 0) return;
    
    let prevIndex = currentTrackIndex;
    if (mode === 'random') {
       prevIndex = Math.floor(Math.random() * playlist.length);
    } else {
       prevIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    }
    playTrack(prevIndex);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  // --- Click Outside ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowPlaylist(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // --- Render Helpers ---
  const getArtists = (track: Track) => {
    const artists = track.ar || track.artists || [];
    return artists.map(a => a.name).join(', ') || 'Unknown Artist';
  };

  const getCover = (track: Track) => {
    return track.al?.picUrl || track.album?.picUrl || '';
  };

  // --- UI Components ---
  
  if (!playlist) return null;

  return (
    <div 
      ref={containerRef}
      className={styles.container}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
            className={styles.player}
          >
            {/* Header / Current Song */}
            <div className={styles.header}>
               <button 
                 onClick={() => setIsOpen(false)}
                 className={styles.closeBtn}
                 aria-label="Close player"
               >
                 <FiX size={18} />
               </button>

               <div className={styles.trackInfo}>
                 {/* Cover Art Placeholder */}
                 <div className={styles.cover}>
                    {currentTrack && getCover(currentTrack) ? (
                        <img src={getCover(currentTrack)} alt="Cover" className={styles.coverImg} />
                    ) : (
                        <FiMusic size={24} />
                    )}
                 </div>
                 <div className={styles.meta}>
                    <h3 className={styles.title}>
                      {currentTrack ? currentTrack.name : 'No Song Selected'}
                    </h3>
                    <p className={styles.artist}>
                      {currentTrack ? getArtists(currentTrack) : 'Select a song'}
                    </p>
                 </div>
               </div>
            </div>

            {/* Progress Bar */}
            <div className={styles.progressSection}>
               <div className={styles.times}>
                 <span>{formatTime(progress)}</span>
                 <span>{formatTime(duration || 0)}</span>
               </div>
               <input
                 type="range"
                 min="0"
                 max={duration || 100}
                 value={progress}
                 onChange={handleSeek}
                 className={styles.rangeInput}
                 aria-label="Seek"
               />
            </div>

            {/* Controls */}
            <div className={styles.controlsSection}>
               {/* Main Buttons */}
               <div className={styles.mainControls}>
                  {/* Mode Switch */}
                  <button 
                    onClick={() => {
                        const modes: PlayMode[] = ['sequence', 'random', 'single'];
                        const next = modes[(modes.indexOf(mode) + 1) % modes.length];
                        setMode(next);
                    }}
                    className={`${styles.iconBtn} ${mode !== 'sequence' ? styles.active : ''}`}
                    title={`Mode: ${mode}`}
                  >
                    {mode === 'random' && <BiShuffle size={20} />}
                    {mode === 'single' && <RiRepeatOneFill size={20} />}
                    {mode === 'sequence' && <FiRepeat size={20} />}
                  </button>

                  <div className={styles.btnGroup}>
                     <button onClick={handlePrev} className={styles.iconBtn}>
                       <FiSkipBack size={24} />
                     </button>
                     <button 
                       onClick={togglePlay} 
                       className={styles.playBtn}
                     >
                       {isPlaying ? <FiPause size={24} /> : <FiPlay size={24} fill="currentColor" />}
                     </button>
                     <button onClick={() => handleNext(false)} className={styles.iconBtn}>
                       <FiSkipForward size={24} />
                     </button>
                  </div>

                  {/* Playlist Toggle */}
                  <button 
                    onClick={() => setShowPlaylist(!showPlaylist)}
                    className={`${styles.iconBtn} ${showPlaylist ? styles.active : ''}`}
                  >
                    <FiList size={20} />
                  </button>
               </div>

               {/* Volume */}
               <div className={styles.volumeControl}>
                  <button onClick={() => setVolume(v => v === 0 ? 0.7 : 0)} className={styles.iconBtn}>
                    {volume === 0 ? <FiVolumeX size={16} /> : <FiVolume2 size={16} />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className={styles.rangeInput}
                  />
               </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className={styles.error}>
                    {error}
                </div>
            )}

            {/* Playlist View */}
            <AnimatePresence>
                {showPlaylist && (
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 250 }}
                        exit={{ height: 0 }}
                        className={styles.playlist}
                    >
                        <ul className={styles.playlistList}>
                            {playlist.map((track, idx) => (
                                <li 
                                    key={track.id}
                                    onClick={() => playTrack(idx)}
                                    className={`${styles.playlistItem} ${idx === currentTrackIndex ? styles.active : ''}`}
                                >
                                    <span className={styles.trackIndex}>{idx + 1}</span>
                                    <div className={styles.trackMeta}>
                                        <div className={styles.trackName}>{track.name}</div>
                                        <div className={styles.trackArtist}>{getArtists(track)}</div>
                                    </div>
                                    {idx === currentTrackIndex && isPlaying && (
                                        <FiMusic className="animate-bounce ml-2" />
                                    )}
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        layout
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`${styles.toggleBtn} ${isOpen ? styles.open : ''} ${isPlaying && !isOpen ? styles.spinning : ''}`}
        aria-label={isOpen ? "Close player" : "Open player"}
      >
        {isOpen ? <FiX size={24} /> : <FiMusic size={24} />}
      </motion.button>
    </div>
  );
}
