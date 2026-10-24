export const videoQualities = ['auto', '480p', '720p', '1080p', '4k'] as const;
export type VideoQuality = typeof videoQualities[number];
export interface PlaybackPreferences { quality: VideoQuality; autoplay: boolean }
export const defaultPlaybackPreferences: PlaybackPreferences = { quality: 'auto', autoplay: true };
export const playbackPreferencesEvent = 'ks:playback-preferences';

export const playbackPreferencesKey = (accountId: string) => {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(accountId)) throw Error('Invalid account.');
  return `ks:playback:v1:${accountId.toLowerCase()}`;
};

export function parsePlaybackPreferences(value: string | null): PlaybackPreferences | null {
  if (value === null) return null;
  if (value.length > 2048) throw Error('Stored playback preferences are invalid.');
  const parsed: unknown = JSON.parse(value);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw Error('Stored playback preferences are invalid.');
  const record = parsed as Record<string, unknown>;
  if (record.version !== 1 || typeof record.autoplay !== 'boolean' || !videoQualities.some(quality => quality === record.quality)) throw Error('Stored playback preferences are invalid.');
  return { quality: record.quality as VideoQuality, autoplay: record.autoplay };
}

export function storePlaybackPreferences(storage: Pick<Storage, 'setItem'>, accountId: string, preferences: PlaybackPreferences) {
  const value = JSON.stringify({ version: 1, quality: preferences.quality, autoplay: preferences.autoplay });
  parsePlaybackPreferences(value);
  storage.setItem(playbackPreferencesKey(accountId), value);
}

// Prefer the requested height or the nearest lower available rendition. If
// every rendition is higher, use the lowest; unsupported/native streams stay automatic.
export function preferredVideoLevel(heights: readonly number[], quality: VideoQuality): number {
  if (quality === 'auto') return -1;
  const target = quality === '4k' ? 2160 : Number.parseInt(quality, 10);
  const levels = heights.map((height, index) => ({ height, index })).filter(level => Number.isFinite(level.height) && level.height > 0);
  const lower = levels.filter(level => level.height <= target).sort((a, b) => b.height - a.height || a.index - b.index);
  return lower[0]?.index ?? levels.sort((a, b) => a.height - b.height || a.index - b.index)[0]?.index ?? -1;
}
