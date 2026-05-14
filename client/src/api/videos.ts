import { request } from "./http";
import type {
  ActivateSceneKeyframeSetResponse,
  CreateSceneKeyframeSetResponse,
  CreateSceneJobPayload,
  CreateSceneJobResponse,
  JobViewerResponse,
  RunSceneJobGsResponse,
  SceneKeyframeSetsResponse,
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
  pipeline?: "3dgs" | "sfm" | "gs";
};

export function getSceneJobs(sceneId: string | number, options: GetSceneJobsOptions = {}) {
  const params = new URLSearchParams();
  params.set("limit", String(Math.min(50, Math.max(1, options.limit ?? 20))));
  if (options.pipeline) {
    params.set("pipeline", options.pipeline);
  }
  if (options.cursor) {
    params.set("cursor", options.cursor);
  }

  return request<SceneJobsResponse>(`/api/v1/scenes/${encodeURIComponent(String(sceneId))}/jobs?${params.toString()}`, {
    auth: true,
  });
}

export function getJobViewer(jobId: string | number, options: { view?: "sfm" | "gs" } = {}) {
  const params = new URLSearchParams();
  if (options.view) {
    params.set("view", options.view);
  }
  const query = params.toString();
  return request<JobViewerResponse>(`/api/v1/jobs/${encodeURIComponent(String(jobId))}/viewer${query ? `?${query}` : ""}`, {
    auth: true,
  });
}

export function createSceneJob(sceneId: string | number, payload: CreateSceneJobPayload = {}) {
  return request<CreateSceneJobResponse>(`/api/v1/scenes/${encodeURIComponent(String(sceneId))}/jobs`, {
    method: "POST",
    body: {
      pipeline: payload.pipeline ?? "3dgs",
      keyframeSetId: payload.keyframeSetId ?? null,
    },
    auth: true,
  });
}

export function runSceneJobGs(sceneId: string | number, jobId: string | number) {
  return request<RunSceneJobGsResponse>(
    `/api/v1/scenes/${encodeURIComponent(String(sceneId))}/jobs/${encodeURIComponent(String(jobId))}/gs`,
    {
      method: "POST",
      body: {},
      auth: true,
    }
  );
}

export function getSceneKeyframeSets(sceneId: string | number) {
  return request<SceneKeyframeSetsResponse>(
    `/api/v1/scenes/${encodeURIComponent(String(sceneId))}/keyframe-sets`,
    { auth: true }
  );
}

export function createSceneKeyframeSet(sceneId: string | number) {
  return request<CreateSceneKeyframeSetResponse>(
    `/api/v1/scenes/${encodeURIComponent(String(sceneId))}/keyframe-sets`,
    {
      method: "POST",
      body: {},
      auth: true,
    }
  );
}

export function activateSceneKeyframeSet(sceneId: string | number, keyframeSetId: string | number) {
  return request<ActivateSceneKeyframeSetResponse>(
    `/api/v1/scenes/${encodeURIComponent(String(sceneId))}/keyframe-sets/${encodeURIComponent(String(keyframeSetId))}/active`,
    {
      method: "PATCH",
      body: {},
      auth: true,
    }
  );
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
      reject(new Error(`FILE_UPLOAD_FAILED ${xhr.status} ${xhr.responseText ?? ""}`.trim()));
    };

    xhr.onerror = () => reject(new Error("FILE_UPLOAD_FAILED NETWORK_ERROR"));
    xhr.ontimeout = () => reject(new Error("FILE_UPLOAD_FAILED TIMEOUT"));
    console.log(
      "[FILE_UPLOAD] file",
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
