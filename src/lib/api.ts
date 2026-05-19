/**
 * Typed API client.
 * All requests go to /api/* which Vite proxies to the FastAPI backend in dev.
 * The JWT token is persisted in localStorage and attached to every protected request.
 */

const BASE = '/api';
const TOKEN_KEY = 'rl_token';

// ── Types ─────────────────────────────────────────────────

export interface LoginResult {
  token: string;
  user_id: number;
  phone: string;
  total_points: number;
}

export interface ProjectOut {
  id: string;
  name: string;
  status: string;
  type: string;
  close_date: string;
  points: number;
  participation_id: number | null;
}

export interface PresignedResponse {
  upload_url: string;
  key: string;
}

export interface VerifyResult {
  visual_passed: boolean;
  context_passed: boolean;
  passed: boolean;
  visual_details: { step: number; passed: boolean; reason: string }[];
  context_score: number;
  context_summary: string;
  context_reason: string;
}

export interface UserOut {
  id: number;
  phone: string;
  total_points: number;
}

// ── Internals ─────────────────────────────────────────────

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ── Auth ──────────────────────────────────────────────────

export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export async function requestOtp(phone: string): Promise<void> {
  await request('POST', '/auth/request-otp', { phone });
}

export async function verifyOtp(phone: string, otp: string): Promise<LoginResult> {
  const result = await request<LoginResult>('POST', '/auth/verify-otp', { phone, otp });
  saveToken(result.token);
  return result;
}

// ── User ──────────────────────────────────────────────────

export async function getMe(): Promise<UserOut> {
  return request<UserOut>('GET', '/projects/me');
}

// ── Projects ──────────────────────────────────────────────

export async function getProjects(): Promise<ProjectOut[]> {
  return request<ProjectOut[]>('GET', '/projects/');
}

export async function acceptProject(id: string): Promise<ProjectOut> {
  return request<ProjectOut>('POST', `/projects/${id}/accept`);
}

export async function submitProject(
  id: string,
  photoKeys: string[],
  videoKey: string,
): Promise<void> {
  await request('POST', `/projects/${id}/submit`, {
    photo_keys: photoKeys,
    video_key: videoKey,
  });
}

export async function completeProject(id: string): Promise<{ total_points: number; points_awarded: number }> {
  return request('POST', `/projects/${id}/complete`);
}

// ── Uploads ───────────────────────────────────────────────

export async function getPhotoUploadUrl(
  projectId: string,
  step: number,
): Promise<PresignedResponse> {
  return request<PresignedResponse>('POST', '/uploads/photo-url', {
    project_id: projectId,
    step,
  });
}

export async function getVideoUploadUrl(projectId: string): Promise<PresignedResponse> {
  return request<PresignedResponse>('POST', '/uploads/video-url', {
    project_id: projectId,
  });
}

// ── Verify ────────────────────────────────────────────────

export async function verifyProject(id: string): Promise<VerifyResult> {
  return request<VerifyResult>('POST', `/verify/${id}`);
}

// ── S3 direct upload with progress ───────────────────────

export function uploadToS3(
  presignedUrl: string,
  blob: Blob,
  onProgress?: (pct: number) => void,
  timeoutMs = 60000,
): Promise<void> {
  // Mock URLs (no S3 configured) — skip upload silently
  if (presignedUrl.startsWith('mock://')) {
    onProgress?.(100);
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.timeout = timeoutMs;
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    });
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`S3 upload failed: HTTP ${xhr.status} — ${xhr.responseText?.slice(0, 200)}`));
    });
    xhr.addEventListener('error', () => reject(new Error('S3 upload network error (CORS or DNS)')));
    xhr.addEventListener('timeout', () => reject(new Error(`S3 upload timed out after ${timeoutMs}ms`)));
    xhr.addEventListener('abort', () => reject(new Error('S3 upload aborted')));
    xhr.open('PUT', presignedUrl);
    // Content-Type MUST match what the presigned URL was signed with (image/jpeg).
    xhr.setRequestHeader('Content-Type', blob.type || 'image/jpeg');
    xhr.send(blob);
  });
}
