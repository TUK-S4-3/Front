import { request } from "./http";
import type {
  CreateSceneJobPayload,
  CreateSceneJobResponse,
  JobViewerResponse,
  SceneJobProgressResponse,
  SceneJobsResponse,
  VideoCompleteResponse,
  VideoPresignResponse,
  VideoScenesResponse,
} from "./types";

type PresignPayload = {
  filename: string;
  contentType: string;
  title: string;
};

type CompletePayload = {
  sceneId: string;
  key: string;
};

export function presignVideo(payload: PresignPayload) {
  return request<VideoPresignResponse>("/api/videos/presign", {
    method: "POST",
    body: payload,
    auth: true,
  });
}

export function completeVideo(payload: CompletePayload) {
  return request<VideoCompleteResponse>("/api/videos/complete", {
    method: "POST",
    body: payload,
    auth: true,
  });
}

export function getMyScenes(page = 1) {
  return request<VideoScenesResponse>(`/api/v1/users/me/scenes?page=${page}`, {
    auth: true,
  });
}

type GetSceneJobsOptions = {
  cursor?: string;
  limit?: number;
  pipeline?: "3dgs";
};

export function getSceneJobs(sceneId: string | number, options: GetSceneJobsOptions = {}) {
  const params = new URLSearchParams();
  params.set("limit", String(Math.min(50, Math.max(1, options.limit ?? 20))));
  params.set("pipeline", options.pipeline ?? "3dgs");
  if (options.cursor) {
    params.set("cursor", options.cursor);
  }

  return request<SceneJobsResponse>(`/api/v1/scenes/${encodeURIComponent(String(sceneId))}/jobs?${params.toString()}`, {
    auth: true,
  });
}

export function getJobViewer(jobId: string | number) {
  return request<JobViewerResponse>(`/api/v1/jobs/${encodeURIComponent(String(jobId))}/viewer`, {
    auth: true,
  });
}

export function createSceneJob(sceneId: string | number, payload: CreateSceneJobPayload) {
  return request<CreateSceneJobResponse>(`/api/v1/scenes/${encodeURIComponent(String(sceneId))}/jobs`, {
    method: "POST",
    body: {
      pipeline: payload.pipeline ?? "3dgs",
      imageCount: payload.imageCount,
      overlap: payload.overlap,
      iteration: payload.iteration,
    },
    auth: true,
  });
}

export function getSceneJobProgress(sceneId: string | number, jobId: string | number) {
  return request<SceneJobProgressResponse>(
    `/api/v1/scenes/${encodeURIComponent(String(sceneId))}/jobs/${encodeURIComponent(String(jobId))}/progress`,
    { auth: true }
  );
}

export async function putVideoToPresignedUrl(
  url: string,
  file: File,
  contentType: string,
  onProgress?: (percent: number) => void
) {
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);

    xhr.upload.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable) return;
      const percent = Math.min(100, Math.round((event.loaded / event.total) * 100));
      onProgress(percent);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      reject(new Error(`S3_UPLOAD_FAILED ${xhr.status} ${xhr.responseText ?? ""}`.trim()));
    };

    xhr.onerror = () => reject(new Error("S3_UPLOAD_FAILED NETWORK_ERROR"));
    xhr.ontimeout = () => reject(new Error("S3_UPLOAD_FAILED TIMEOUT"));
    console.log(
      "[S3_UPLOAD] file",
      file,
      "isFile=",
      file instanceof File,
      "size=",
      file?.size,
      "type=",
      file?.type
    );
    xhr.send(file);
  });
}
