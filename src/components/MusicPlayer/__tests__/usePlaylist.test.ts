// 验证预加载与点击共用在途解析，失败后能重新发起请求。
import { act, renderHook } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { checkSongAvailability, getSongUrl } from '../services';
import { usePlaylist } from '../hooks/usePlaylist';

vi.mock('../services', () => ({
  fetchPlaylistData: vi.fn(), checkSongAvailability: vi.fn(), getSongUrl: vi.fn(),
}));
beforeEach(() => vi.resetAllMocks());

it('同一歌曲的并发准备只发起一次解析，成功后复用缓存', async () => {
  let finish!: (url: string) => void;
  vi.mocked(checkSongAvailability).mockResolvedValue(false);
  vi.mocked(getSongUrl).mockReturnValue(new Promise(resolve => { finish = resolve; }));
  const { result } = renderHook(() => usePlaylist());
  act(() => result.current.setPlaylist([{ id: 123, name: '测试歌曲' }]));
  const first = result.current.prepareTrack(0);
  const second = result.current.prepareTrack(0);
  await act(async () => { await Promise.resolve(); });
  expect(getSongUrl).toHaveBeenCalledTimes(1);
  expect(checkSongAvailability).toHaveBeenCalledTimes(1);
  finish('https://music.example/song.mp3');
  expect(await first).toEqual(await second);
  await result.current.prepareTrack(0);
  expect(getSongUrl).toHaveBeenCalledTimes(1);
});

it('失败的解析不被永久缓存，下一次操作能够重试', async () => {
  vi.mocked(checkSongAvailability).mockResolvedValue(true);
  vi.mocked(getSongUrl).mockResolvedValueOnce(null).mockResolvedValueOnce('https://music.example/song.mp3');
  const { result } = renderHook(() => usePlaylist());
  act(() => result.current.setPlaylist([{ id: 123, name: '测试歌曲' }]));
  expect((await result.current.prepareTrack(0)).url).toBeNull();
  expect((await result.current.prepareTrack(0)).url).toBe('https://music.example/song.mp3');
  expect(getSongUrl).toHaveBeenCalledTimes(2);
});
