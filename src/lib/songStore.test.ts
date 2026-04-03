import { describe, it, expect } from 'vitest';
import { resolveParam } from './songStore';

describe('resolveParam', () => {
  const mockSong = {
    tempo: 120,
    restPct: 0.5,
    parts: [
      {
        name: 'part1',
        restPct: 0.25,
        voices: [
          { file: 'v1.mid', restPct: 0.1 },
          { file: 'v2.mid' }
        ]
      },
      {
        name: 'part2',
        voices: [
          { file: 'v3.mid' }
        ]
      }
    ]
  };

  it('should resolve from voice level first', () => {
    const value = resolveParam(mockSong, 0, 0, 'restPct');
    expect(value).toBe(0.1);
  });

  it('should resolve from part level if missing in voice', () => {
    const value = resolveParam(mockSong, 0, 1, 'restPct');
    expect(value).toBe(0.25);
  });

  it('should resolve from song level if missing in voice and part', () => {
    const value = resolveParam(mockSong, 1, 0, 'restPct');
    expect(value).toBe(0.5);
  });

  it('should resolve correctly for top-level only params', () => {
    const value = resolveParam(mockSong, 0, 0, 'tempo');
    expect(value).toBe(120);
  });

  it('should return undefined if param is missing everywhere', () => {
    const value = resolveParam(mockSong, 0, 0, 'missingParam');
    expect(value).toBeUndefined();
  });
});
