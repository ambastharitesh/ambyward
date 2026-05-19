/**
 * Module-level singleton that holds binary blobs between journey screens.
 * This avoids passing large File/Blob objects through React context.
 * Reset between journeys via `clearUploadStore()`.
 */

export interface PhotoCapture {
  step: number;
  blob: Blob;
  key: string;   // S3 key returned by backend (filled after upload)
}

interface UploadStore {
  photos: PhotoCapture[];
  videoBlob: Blob | null;
  videoKey: string;   // S3 key returned by backend (filled after upload)
}

export const uploadStore: UploadStore = {
  photos: [],
  videoBlob: null,
  videoKey: '',
};

export function clearUploadStore(): void {
  uploadStore.photos = [];
  uploadStore.videoBlob = null;
  uploadStore.videoKey = '';
}
