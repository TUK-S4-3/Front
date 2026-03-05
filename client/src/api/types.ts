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

export type VideoScene = {
  id: string;
  title: string;
  status: UploadStatus;
  uploadId: string;
  inputVideoKey: string;
  sfmResultKey: string | null;
  gaussianSplatKey: string | null;
  meshKey: string | null;
  thumbnailKey: string | null;
  createdAt: string;
  updatedAt: string;
  finishedAt: string | null;
};

export type VideoScenesResponse = {
  ok: boolean;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  items: VideoScene[];
};

export type JobStatus = "queued" | "processing" | "ready" | "failed" | "canceled";

export type SceneJob = {
  id: number;
  pipeline: string;
  status: JobStatus;
  createdAt: string;
  finishedAt: string | null;
  errorMessage: string | null;
  resultExists: boolean;
};

export type SceneJobsResponse = {
  sceneId: string | number;
  inputVideoKey?: string | null;
  jobs: SceneJob[];
  nextCursor: string | null;
};

export type ViewerFileMeta = {
  contentLength: number;
  etag: string;
  acceptRanges: boolean;
};

export type JobViewerResponse = {
  jobId: number;
  sceneId: string | number;
  pipeline: string;
  status: JobStatus;
  format: string;
  resultUrl: string | null;
  file: ViewerFileMeta | null;
  updatedAt: string;
};

export type CreateSceneJobPayload = {
  imageCount: number;
  overlap: number;
  iteration: number;
  pipeline?: "3dgs";
};

export type CreateSceneJobResponse = {
  jobId: number;
  sceneId: number;
  status: string;
  batchJobId?: string;
  progressKey?: string;
  statusKey?: string;
};

export type JobProgressStage =
  | "DOWNLOADING"
  | "EXTRACTING_FRAMES"
  | "SFM_FEATURE"
  | "SFM_MATCH"
  | "SFM_MAPPER"
  | "UNDISTORT"
  | "GS_TRAINING"
  | "UPLOADING"
  | "DONE"
  | string;

export type JobProgressMetrics = {
  imgRequested?: number;
  frameCount?: number;
  itersRequested?: number;
  iter?: number;
  iters?: number;
};

export type SceneJobProgressResponse = {
  sceneId: string | number;
  jobId: string | number;
  status: string;
  stage?: JobProgressStage;
  progress?: number;
  detail?: string;
  updatedAt?: string;
  metrics?: JobProgressMetrics;
};
