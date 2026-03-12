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
  email?: string | null;
  name?: string | null;
  nickname?: string | null;
  provider?: string | null;
  profileImageUrl?: string | null;
  profileImageUpdatedAt?: string | null;
};

export type SessionResponse = {
  authenticated: boolean;
  user: SessionUser | null;
};

export type UserProfile = {
  id: number;
  email?: string | null;
  name?: string | null;
  nickname?: string | null;
  provider?: string | null;
  profileImageUrl?: string | null;
  profileImageUpdatedAt?: string | null;
  createdAt?: string | null;
};

export type UserProfileResponse = {
  ok?: boolean;
  user: UserProfile;
};

export type UpdateProfileResponse = {
  ok: boolean;
  message?: string;
  user: UserProfile;
};

export type ProfileImagePresignResponse = {
  ok: boolean;
  key: string;
  uploadUrl: string;
  profileImageUrl: string | null;
  expiresIn: number;
};

export type ProfileImageCompleteResponse = {
  ok: boolean;
  profileImageUrl: string | null;
  profileImageUpdatedAt: string | null;
};

export type MyProfilePost = {
  postId: number | string;
  title: string;
  thumbnailUrl: string | null;
  createdAt: string | null;
  likeCount: number;
  downloadCount: number;
  sceneId?: number | string | null;
  jobId?: number | string | null;
  viewerPath?: string | null;
};

export type MyProfilePostsResponse = {
  items: MyProfilePost[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
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

export type SceneLatestJobSummary = {
  jobId: number;
  status: string;
  viewerReady?: boolean;
  postable?: boolean;
  createdAt?: string;
  endedAt?: string | null;
};

export type VideoScene = {
  id: string | number;
  userId?: number;
  title: string;
  uploadId?: string | number;
  inputVideoKey?: string | null;
  createdAt: string;
  updatedAt: string;
  latestJobSummary?: SceneLatestJobSummary | null;
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
  sceneId?: string | number;
  batchJobId?: string | null;
  uploadId?: string | number | null;
  pipeline?: string | null;
  status: string;
  stage?: string | null;
  progressPercent?: number | null;
  cancelRequested?: boolean;
  attempt?: number | null;
  errorCode?: string | null;
  createdAt: string;
  updatedAt?: string;
  startedAt?: string | null;
  endedAt?: string | null;
  finishedAt?: string | null;
  errorMessage?: string | null;
  resultExists?: boolean;
  imageCount?: number | null;
  overlap?: number | null;
  iteration?: number | null;
  sfmResultKey?: string | null;
  gaussianSplatKey?: string | null;
  meshKey?: string | null;
  thumbnailKey?: string | null;
  viewerReady?: boolean;
  postable?: boolean;
  alreadyPosted?: boolean;
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
  status: string;
  format: string;
  resultUrl: string | null;
  file: ViewerFileMeta | null;
  updatedAt: string;
  viewerReady?: boolean;
  postable?: boolean;
  alreadyPosted?: boolean;
  postId?: number | null;
  isOwner?: boolean;
  thumbnailUrl?: string | null;
  thumbnailUpdatedAt?: string | null;
};

export type CreatePostPayload = {
  jobId: number | string;
  title?: string | null;
};

export type CreatePostResponse = {
  postId: number;
  jobId: number | string;
  sceneId: number | string;
  title: string;
  shareUuid: string;
  viewerPath: string;
};

export type DeletePostResponse = {
  ok: boolean;
  postId: number | string;
  message?: string;
};

export type PostThumbnailPresignResponse = {
  ok: boolean;
  postId: number | string;
  sceneId: number | string;
  jobId: number | string;
  key: string;
  uploadUrl: string;
  thumbnailUrl: string | null;
  expiresIn: number;
};

export type PostThumbnailCompleteResponse = {
  ok: boolean;
  thumbnailUrl: string | null;
  thumbnailUpdatedAt: string | null;
};

export type CreateSceneJobPayload = {
  imageCount: number;
  overlap: number;
  iteration: number;
  pipeline?: "3dgs";
};

export type CreateSceneJobResponse = {
  jobId: number;
  sceneId: string | number;
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
