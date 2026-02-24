import { request } from "./http";
import type { Upload } from "./types";

export function adminUploads() {
  return request<{ ok: true; uploads: Upload[] }>("/api/admin/uploads");
}

// 결과 등록
export function adminUploadResult(uploadId: number, resultFileKey: string) {
  return request<{ ok: true; uploadId: number; resultFileKey: string }>(
    `/api/admin/uploads/${uploadId}/result`,
    {
      method: "POST",
      body: { resultFileKey },
    }
  );
}
