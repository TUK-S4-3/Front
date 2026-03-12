import { request } from "./http";

export type PublicPost = {
  id: number | string;
  postId: number | string;
  title: string;
  authorName: string | null;
  authorProfileImageUrl: string | null;
  createdAt: string | null;
  likeCount: number;
  downloadCount: number;
  thumbnailUrl: string | null;
  jobId: number | string | null;
  sceneId: number | string | null;
};

export type PublicPostsResponse = {
  posts: PublicPost[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
};

export type PublicViewerFileMeta = {
  contentLength: number;
  etag: string;
  acceptRanges: boolean;
};

export type PublicPostViewer = {
  id: number | string;
  postId: number | string;
  jobId: number | string | null;
  sceneId: number | string | null;
  title: string;
  authorName: string | null;
  authorProfileImageUrl: string | null;
  isOwner: boolean;
  likeCount: number;
  downloadCount: number;
  viewerReady: boolean;
  status: string;
  resultUrl: string | null;
  file: PublicViewerFileMeta | null;
  thumbnailUrl: string | null;
};

type RawPublicPost = Partial<PublicPost> & {
  id?: number | string;
  postId?: number | string;
  title?: string | null;
  authorName?: string | null;
  authorProfileImageUrl?: string | null;
  createdAt?: string | null;
  likeCount?: number | string | null;
  downloadCount?: number | string | null;
  thumbnailUrl?: string | null;
  jobId?: number | string | null;
  sceneId?: number | string | null;
};

type RawPublicPostsResponse = {
  posts?: RawPublicPost[] | null;
  items?: RawPublicPost[] | null;
  page?: number | string | null;
  pageSize?: number | string | null;
  totalCount?: number | string | null;
  totalPages?: number | string | null;
  hasNext?: boolean | null;
};

type RawPublicPostViewer = Partial<PublicPostViewer> & {
  id?: number | string;
  postId?: number | string;
  jobId?: number | string | null;
  sceneId?: number | string | null;
  title?: string | null;
  authorName?: string | null;
  authorProfileImageUrl?: string | null;
  isOwner?: boolean | null;
  likeCount?: number | string | null;
  downloadCount?: number | string | null;
  viewerReady?: boolean | null;
  status?: string | null;
  resultUrl?: string | null;
  file?: Partial<PublicViewerFileMeta> | null;
  thumbnailUrl?: string | null;
};

const SHOULD_USE_PUBLIC_MOCK = import.meta.env.VITE_USE_MOCKS === "true";
const DEFAULT_PAGE_SIZE = 6;

const MOCK_POSTS: PublicPost[] = [
  {
    id: 1,
    postId: 1,
    title: "Seoul Ceramic Lantern",
    authorName: "minseo",
    authorProfileImageUrl: null,
    createdAt: "2026-03-10T11:10:00.000Z",
    likeCount: 18,
    downloadCount: 6,
    thumbnailUrl: null,
    jobId: 201,
    sceneId: 41,
  },
  {
    id: 2,
    postId: 2,
    title: "Archive Hall Chair Study",
    authorName: "jiho",
    authorProfileImageUrl: null,
    createdAt: "2026-03-09T08:35:00.000Z",
    likeCount: 11,
    downloadCount: 2,
    thumbnailUrl: null,
    jobId: 202,
    sceneId: 42,
  },
  {
    id: 3,
    postId: 3,
    title: "Museum Mask Reconstruction",
    authorName: "ara",
    authorProfileImageUrl: null,
    createdAt: "2026-03-08T16:20:00.000Z",
    likeCount: 27,
    downloadCount: 13,
    thumbnailUrl: null,
    jobId: 203,
    sceneId: 43,
  },
  {
    id: 4,
    postId: 4,
    title: "Studio Vessel Prototype",
    authorName: "haneul",
    authorProfileImageUrl: null,
    createdAt: "2026-03-07T05:40:00.000Z",
    likeCount: 7,
    downloadCount: 1,
    thumbnailUrl: null,
    jobId: 204,
    sceneId: 44,
  },
  {
    id: 5,
    postId: 5,
    title: "Pattern Relief Fragment",
    authorName: "eun",
    authorProfileImageUrl: null,
    createdAt: "2026-03-06T13:55:00.000Z",
    likeCount: 14,
    downloadCount: 4,
    thumbnailUrl: null,
    jobId: 205,
    sceneId: 45,
  },
  {
    id: 6,
    postId: 6,
    title: "Round Table Surface Capture",
    authorName: "doyun",
    authorProfileImageUrl: null,
    createdAt: "2026-03-05T10:15:00.000Z",
    likeCount: 9,
    downloadCount: 3,
    thumbnailUrl: null,
    jobId: 206,
    sceneId: 46,
  },
  {
    id: 7,
    postId: 7,
    title: "Gallery Corner Scan",
    authorName: "seo",
    authorProfileImageUrl: null,
    createdAt: "2026-03-04T04:25:00.000Z",
    likeCount: 5,
    downloadCount: 1,
    thumbnailUrl: null,
    jobId: 207,
    sceneId: 47,
  },
];

const MOCK_VIEWERS: Record<string, PublicPostViewer> = {
  "1": {
    id: 1,
    postId: 1,
    jobId: 201,
    sceneId: 41,
    title: "Seoul Ceramic Lantern",
    authorName: "minseo",
    authorProfileImageUrl: null,
    isOwner: false,
    likeCount: 18,
    downloadCount: 6,
    viewerReady: false,
    status: "ready",
    resultUrl: null,
    file: {
      contentLength: 0,
      etag: "-",
      acceptRanges: false,
    },
    thumbnailUrl: null,
  },
  "2": {
    id: 2,
    postId: 2,
    jobId: 202,
    sceneId: 42,
    title: "Archive Hall Chair Study",
    authorName: "jiho",
    authorProfileImageUrl: null,
    isOwner: true,
    likeCount: 11,
    downloadCount: 2,
    viewerReady: false,
    status: "processing",
    resultUrl: null,
    file: null,
    thumbnailUrl: null,
  },
  "3": {
    id: 3,
    postId: 3,
    jobId: 203,
    sceneId: 43,
    title: "Museum Mask Reconstruction",
    authorName: "ara",
    authorProfileImageUrl: null,
    isOwner: false,
    likeCount: 27,
    downloadCount: 13,
    viewerReady: false,
    status: "failed",
    resultUrl: null,
    file: null,
    thumbnailUrl: null,
  },
  "4": {
    id: 4,
    postId: 4,
    jobId: 204,
    sceneId: 44,
    title: "Studio Vessel Prototype",
    authorName: "haneul",
    authorProfileImageUrl: null,
    isOwner: false,
    likeCount: 7,
    downloadCount: 1,
    viewerReady: false,
    status: "queued",
    resultUrl: null,
    file: null,
    thumbnailUrl: null,
  },
  "5": {
    id: 5,
    postId: 5,
    jobId: 205,
    sceneId: 45,
    title: "Pattern Relief Fragment",
    authorName: "eun",
    authorProfileImageUrl: null,
    isOwner: false,
    likeCount: 14,
    downloadCount: 4,
    viewerReady: false,
    status: "canceled",
    resultUrl: null,
    file: null,
    thumbnailUrl: null,
  },
  "6": {
    id: 6,
    postId: 6,
    jobId: 206,
    sceneId: 46,
    title: "Round Table Surface Capture",
    authorName: "doyun",
    authorProfileImageUrl: null,
    isOwner: false,
    likeCount: 9,
    downloadCount: 3,
    viewerReady: false,
    status: "ready",
    resultUrl: null,
    file: null,
    thumbnailUrl: null,
  },
  "7": {
    id: 7,
    postId: 7,
    jobId: 207,
    sceneId: 47,
    title: "Gallery Corner Scan",
    authorName: "seo",
    authorProfileImageUrl: null,
    isOwner: false,
    likeCount: 5,
    downloadCount: 1,
    viewerReady: false,
    status: "processing",
    resultUrl: null,
    file: null,
    thumbnailUrl: null,
  },
};

function normalizeNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function normalizeOptionalText(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function normalizeIdentifier(primary: unknown, fallback: unknown, defaultValue: number | string) {
  if (typeof primary === "number" || typeof primary === "string") return primary;
  if (typeof fallback === "number" || typeof fallback === "string") return fallback;
  return defaultValue;
}

function normalizePublicPost(raw: RawPublicPost, index: number): PublicPost {
  const id = normalizeIdentifier(raw.id, raw.postId, index + 1);
  return {
    id,
    postId: normalizeIdentifier(raw.postId, raw.id, id),
    title: normalizeText(raw.title, `Public Post ${String(id)}`),
    authorName: normalizeOptionalText(raw.authorName),
    authorProfileImageUrl: normalizeOptionalText(raw.authorProfileImageUrl),
    createdAt: normalizeOptionalText(raw.createdAt),
    likeCount: normalizeNumber(raw.likeCount, 0),
    downloadCount: normalizeNumber(raw.downloadCount, 0),
    thumbnailUrl: normalizeOptionalText(raw.thumbnailUrl),
    jobId:
      typeof raw.jobId === "number" || typeof raw.jobId === "string"
        ? raw.jobId
        : null,
    sceneId:
      typeof raw.sceneId === "number" || typeof raw.sceneId === "string"
        ? raw.sceneId
        : null,
  };
}

function normalizePublicViewerFile(raw: Partial<PublicViewerFileMeta> | null | undefined): PublicViewerFileMeta | null {
  if (!raw) return null;
  return {
    contentLength: normalizeNumber(raw.contentLength, 0),
    etag: normalizeText(raw.etag, "-"),
    acceptRanges: Boolean(raw.acceptRanges),
  };
}

function normalizePublicPostViewer(raw: RawPublicPostViewer): PublicPostViewer {
  const id = normalizeIdentifier(raw.id, raw.postId, 0);
  return {
    id,
    postId: normalizeIdentifier(raw.postId, raw.id, id),
    jobId:
      typeof raw.jobId === "number" || typeof raw.jobId === "string"
        ? raw.jobId
        : null,
    sceneId:
      typeof raw.sceneId === "number" || typeof raw.sceneId === "string"
        ? raw.sceneId
        : null,
    title: normalizeText(raw.title, `Public Post ${String(id)}`),
    authorName: normalizeOptionalText(raw.authorName),
    authorProfileImageUrl: normalizeOptionalText(raw.authorProfileImageUrl),
    isOwner: Boolean(raw.isOwner),
    likeCount: normalizeNumber(raw.likeCount, 0),
    downloadCount: normalizeNumber(raw.downloadCount, 0),
    viewerReady: Boolean(raw.viewerReady),
    status: normalizeText(raw.status, "queued"),
    resultUrl: normalizeOptionalText(raw.resultUrl),
    file: normalizePublicViewerFile(raw.file),
    thumbnailUrl: normalizeOptionalText(raw.thumbnailUrl),
  };
}

function paginatePosts(posts: PublicPost[], page: number, pageSize: number): PublicPostsResponse {
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const start = (safePage - 1) * safePageSize;
  const sliced = posts.slice(start, start + safePageSize);
  const totalCount = posts.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / safePageSize));

  return {
    posts: sliced,
    page: Math.min(safePage, totalPages),
    pageSize: safePageSize,
    totalCount,
    totalPages,
    hasNext: safePage < totalPages,
  };
}

export async function getPublicPosts(page = 1, pageSize = DEFAULT_PAGE_SIZE): Promise<PublicPostsResponse> {
  if (SHOULD_USE_PUBLIC_MOCK) {
    return paginatePosts(MOCK_POSTS, page, pageSize);
  }

  const response = await request<RawPublicPostsResponse>(
    `/api/v1/posts?page=${encodeURIComponent(String(page))}&pageSize=${encodeURIComponent(String(pageSize))}`
  );
  const rawPosts = Array.isArray(response.posts) ? response.posts : Array.isArray(response.items) ? response.items : [];
  const posts = rawPosts.map((post, index) => normalizePublicPost(post, index));

  return {
    posts,
    page: normalizeNumber(response.page, page),
    pageSize: normalizeNumber(response.pageSize, pageSize),
    totalCount: normalizeNumber(response.totalCount, posts.length),
    totalPages: normalizeNumber(response.totalPages, Math.max(1, Math.ceil(posts.length / Math.max(1, pageSize)))),
    hasNext: Boolean(response.hasNext),
  };
}

export async function getPublicPostViewer(postId: number | string): Promise<PublicPostViewer> {
  if (SHOULD_USE_PUBLIC_MOCK) {
    const mock = MOCK_VIEWERS[String(postId)];
    if (!mock) {
      throw new Error("HTTP 404 Not Found POST_NOT_FOUND");
    }
    return mock;
  }

  const response = await request<RawPublicPostViewer>(`/api/v1/posts/${encodeURIComponent(String(postId))}/viewer`);
  return normalizePublicPostViewer(response);
}
