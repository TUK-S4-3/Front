export type User = { id: number; email: string };

export type LoginRequest = { email: string; password: string };
export type SignupRequest = { email: string; password: string };
export type LoginResponse = {
  ok: boolean;
  message: string;
  user: User;
  token: string;
};

export type SignupResponse = {
  ok: boolean;
  message: string;
  user: User;
};

export type SessionUser = {
  id?: number;
  email?: string;
  name?: string;
  provider?: string;
};

export type SessionResponse = {
  authenticated: boolean;
  user: SessionUser | null;
};

export type UploadStatus = "UPLOADED" | "PROCESSING" | "COMPLETED" | "FAILED" | string;

export type Upload = {
  id: number;
  userId?: number;
  originalFileKey?: string;
  resultFileKey?: string | null;
  status: UploadStatus;
  createdAt: string;
  completedAt?: string | null;
};

export type CreateUploadResponse = { ok: boolean; upload: Upload };
export type MyUploadsResponse = { ok: boolean; uploads: Upload[] };

export type AdminUploadsResponse = { ok: boolean; uploads: Upload[] };
export type AdminUploadResultResponse = { ok: boolean; uploadId: number; resultFileKey: string };

export type VideoPresignResponse = {
  ok: boolean;
  sceneId: string;
  key: string;
  url: string;
  expiresIn: number;
};

export type VideoCompleteResponse = {
  ok: boolean;
  sceneId: string;
  status: "UPLOADED" | string;
  inputVideoKey: string;
};
