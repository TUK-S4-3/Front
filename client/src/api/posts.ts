import { request } from "./http";
import type {
  CreatePostPayload,
  CreatePostResponse,
  DeletePostResponse,
  PostThumbnailCompleteResponse,
  PostThumbnailPresignResponse,
} from "./types";

export function createPost(payload: CreatePostPayload) {
  return request<CreatePostResponse>("/api/v1/posts", {
    method: "POST",
    body: payload,
    auth: true,
  });
}

export function deletePost(postId: number | string) {
  return request<DeletePostResponse>(`/api/v1/posts/${encodeURIComponent(String(postId))}`, {
    method: "DELETE",
    auth: true,
  });
}

export function presignPostThumbnail(postId: number | string) {
  return request<PostThumbnailPresignResponse>(
    `/api/v1/posts/${encodeURIComponent(String(postId))}/thumbnail/presign`,
    {
      method: "POST",
      body: { contentType: "image/jpeg" },
      auth: true,
    }
  );
}

export function completePostThumbnail(postId: number | string, key: string) {
  return request<PostThumbnailCompleteResponse>(
    `/api/v1/posts/${encodeURIComponent(String(postId))}/thumbnail/complete`,
    {
      method: "POST",
      body: { key },
      auth: true,
    }
  );
}

export async function putPostThumbnailToPresignedUrl(url: string, blob: Blob) {
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "image/jpeg",
    },
    body: blob,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`THUMBNAIL_UPLOAD_FAILED ${response.status} ${body}`.trim());
  }
}
