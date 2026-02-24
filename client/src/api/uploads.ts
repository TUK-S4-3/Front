


import { request } from "./http";
import type { CreateUploadResponse, MyUploadsResponse, Upload } from "./types";

export function createUpload() {
  return request<CreateUploadResponse>("/api/uploads", { method: "POST", auth: true });
}

export function myUploads() {
  return request<MyUploadsResponse>("/api/uploads/my", { auth: true });
}


export async function getUpload(id: number): Promise<{ ok: true; upload: Upload }> {
  // 나중에 endpoint: GET /api/uploads/:id
  return request<{ ok: true; upload: Upload }>(`/api/uploads/${id}`, { auth: true });
}


export async function uploadFileMultipart(uploadId: number, file: File) {
  const form = new FormData();
  form.append("file", file);
  form.append("uploadId", String(uploadId));

  // 이후 endpoint: POST /api/uploads/:id/file
  return request<{ ok: true }>(`/api/uploads/${uploadId}/file`, {
    method: "POST",
    body: form,
    auth: true,
    // request()가 JSON만 처리하면, FormData일 때는 headers 건드리면 안 됨
  });
}
