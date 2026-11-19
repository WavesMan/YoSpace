// 使用未完成的真实 Promise 模拟慢请求，验证按钮禁用和操作锁能阻止重复触发。
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MusicPlayer from '../MusicPlayer';
import PlayerButton from '../components/PlayerButton';

const mocks = vi.hoisted(() => ({
  prepareTrack: vi.fn(), playUrl: vi.fn(), togglePlay: vi.fn(),
  fetchPlaylist: vi.fn(), setError: vi.fn(), setIndex: vi.fn(),
  audioRef: { current: null as HTMLAudioElement | null },
  playlist: [{ id: 1, name: '测试歌曲' }, { id: 2, name: '下一首歌曲' }],
}));

vi.mock('../hooks/usePlaylist', () => ({
  usePlaylist: () => ({
    playlist: mocks.playlist, currentTrackIndex: 0, currentTrack: mocks.playlist[0],
    mode: 'sequence', isLoading: false, fetchPlaylist: mocks.fetchPlaylist,
    prepareTrack: mocks.prepareTrack, setCurrentTrackIndex: mocks.setIndex,
    handleNext: () => 1, handlePrev: () => 1,
    handleReorder: vi.fn(), setMode: vi.fn(), setIsLoading: vi.fn(),
  }),
}));
vi.mock('../hooks/useAudio', () => ({
  useAudio: () => ({
    audioRef: mocks.audioRef, isPlaying: false, progress: 0, duration: 0,
    volume: 0.7, error: null, playUrl: mocks.playUrl, togglePlay: mocks.togglePlay,
    seek: vi.fn(), setVolume: vi.fn(), setDuration: vi.fn(), setError: mocks.setError,
  }),
}));
vi.mock('../services', () => ({ fetchLyricData: async () => ({ yrc: '', lrc: '' }) }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.playlist = [{ id: 1, name: '测试歌曲' }, { id: 2, name: '下一首歌曲' }];
  mocks.audioRef.current = new Audio();
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
  mocks.prepareTrack.mockResolvedValue({ url: null, error: null });
  mocks.playUrl.mockResolvedValue(true);
});
afterEach(() => vi.restoreAllMocks());

describe('PlayerButton', () => {
  it('加载时保留内容占位、报告忙碌并禁止重复点击', () => {
    const onClick = vi.fn();
    const { rerender } = render(<PlayerButton aria-label="播放" onClick={onClick}>图标</PlayerButton>);
    fireEvent.click(screen.getByRole('button', { name: '播放' }));
    expect(onClick).toHaveBeenCalledTimes(1);
    rerender(<PlayerButton loading loadingLabel="正在播放" onClick={onClick}>图标</PlayerButton>);
    const button = screen.getByRole('button', { name: '正在播放' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveTextContent('图标');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('MusicPlayer 操作锁', () => {
  it.each(['播放', '上一曲', '下一曲'])('%s慢请求期间只执行一次，完成后恢复操作', async (label) => {
    render(<MusicPlayer />);
    await act(async () => {}); // 等待后台预加载完成，再单独观察用户操作。
    let finish!: (value: boolean) => void;
    mocks.playUrl.mockReturnValueOnce(new Promise<boolean>(resolve => { finish = resolve; }));
    mocks.prepareTrack.mockResolvedValue({ url: 'https://music.example/song.mp3', error: null });
    fireEvent.click(screen.getByRole('button', { name: '打开播放器' }));
    const button = screen.getByRole('button', { name: label });
    // 同一轮事件中的多次触发，也必须被同步锁拦住。
    act(() => { button.click(); button.click(); button.click(); });
    await waitFor(() => expect(mocks.playUrl).toHaveBeenCalledTimes(1));
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    await act(async () => finish(true));
    expect(screen.getByRole('button', { name: label })).toBeEnabled();
  });

  it('恢复播放失败后释放锁，允许重试', async () => {
    mocks.audioRef.current!.src = 'https://music.example/song.mp3';
    let finish!: (value: boolean) => void;
    mocks.togglePlay.mockReturnValueOnce(new Promise<boolean>(resolve => { finish = resolve; }));
    render(<MusicPlayer />);
    fireEvent.click(screen.getByRole('button', { name: '打开播放器' }));
    const button = screen.getByRole('button', { name: '播放' });
    act(() => { button.click(); button.click(); });
    expect(mocks.togglePlay).toHaveBeenCalledTimes(1);
    expect(button).toBeDisabled();
    await act(async () => finish(false));
    expect(button).toBeEnabled();
  });

  it('空歌单禁用播放、切歌和列表操作，但保留关闭按钮', () => {
    mocks.playlist = [];
    render(<MusicPlayer />);
    fireEvent.click(screen.getByRole('button', { name: '打开播放器' }));
    for (const name of ['播放', '上一曲', '下一曲', '切换播放列表']) {
      expect(screen.getByRole('button', { name })).toBeDisabled();
    }
    expect(screen.getAllByRole('button', { name: '关闭播放器' })[0]).toBeEnabled();
  });
});
