import { request } from "./http";
import type { VideoCompleteResponse, VideoPresignResponse } from "./types";

type PresignPayload = {
  filename: string;
  contentType: string;
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
    xhr.send(file);
  });
}
