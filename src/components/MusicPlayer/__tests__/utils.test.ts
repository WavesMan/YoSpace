import { describe, it, expect } from 'vitest';
import { formatTime, getArtists, getCover } from '../utils';
import type { Track } from '../types';

describe('formatTime', () => {
    it('formats seconds to mm:ss', () => {
        expect(formatTime(0)).toBe('00:00');
        expect(formatTime(65)).toBe('01:05');
    });
});

describe('getArtists', () => {
    it('returns artist names', () => {
        const track: Track = {
            id: 1,
            name: 't',
            ar: [{ name: 'A' }, { name: 'B' }],
        };
        expect(getArtists(track)).toBe('A, B');
    });

    it('returns fallback when empty', () => {
        const track: Track = { id: 2, name: 't' };
        expect(getArtists(track)).toBe('Unknown Artist');
    });
});

describe('getCover', () => {
    it('normalizes http to https', () => {
        const track: Track = {
            id: 3,
            name: 't',
            al: { name: 'a', picUrl: 'http://example.com/cover.jpg' },
        };
        expect(getCover(track)).toBe('https://example.com/cover.jpg');
    });
});
