export type ChatUploadKind = 'image' | 'video' | 'document';

export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const VIDEO_MAX_BYTES = 50 * 1024 * 1024;
export const DOCUMENT_MAX_BYTES = 25 * 1024 * 1024;

export const DOCUMENT_ACCEPT =
  '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/csv,application/zip';

const DOCUMENT_MIMES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'application/zip',
  'application/x-zip-compressed',
]);

const VIDEO_MIMES = new Set(['video/mp4', 'video/webm', 'video/quicktime']);

export function validateFileForUpload(
  file: File,
  kind: ChatUploadKind
): string | null {
  if (kind === 'image') {
    if (!file.type.startsWith('image/')) {
      return 'Only image files are supported.';
    }
    if (file.size > IMAGE_MAX_BYTES) {
      return 'Image is too large. Max size is 5MB.';
    }
    return null;
  }
  if (kind === 'video') {
    const mime = file.type.toLowerCase().split(';')[0].trim();
    if (!VIDEO_MIMES.has(mime)) {
      return 'Only MP4, WebM, or MOV videos are supported.';
    }
    if (file.size > VIDEO_MAX_BYTES) {
      return 'Video is too large. Max size is 50MB.';
    }
    return null;
  }
  const mime = file.type.toLowerCase().split(';')[0].trim();
  if (!DOCUMENT_MIMES.has(mime)) {
    return 'This file type is not supported.';
  }
  if (file.size > DOCUMENT_MAX_BYTES) {
    return 'Document is too large. Max size is 25MB.';
  }
  return null;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
