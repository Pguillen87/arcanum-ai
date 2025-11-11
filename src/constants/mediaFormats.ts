export const AUDIO_EXTENSIONS = [
  ".mp3",
  ".wav",
  ".webm",
  ".ogg",
  ".aac",
  ".m4a",
  ".m4b",
  ".mp4",
  ".flac",
] as const;

export const AUDIO_MIME_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/webm",
  "audio/ogg",
  "audio/aac",
  "audio/mp4",
  "audio/x-m4a",
  "audio/m4a",
  "audio/m4b",
  "audio/x-m4b",
  "audio/flac",
] as const;

export const VIDEO_EXTENSIONS = [
  ".mp4",
  ".mov",
  ".webm",
] as const;

export const VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;

export function isAudioMime(mimeType: string): boolean {
  return AUDIO_MIME_TYPES.includes(mimeType.toLowerCase() as (typeof AUDIO_MIME_TYPES)[number]);
}

export function isVideoMime(mimeType: string): boolean {
  return VIDEO_MIME_TYPES.includes(mimeType.toLowerCase() as (typeof VIDEO_MIME_TYPES)[number]);
}
