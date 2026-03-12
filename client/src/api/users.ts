import { request } from "./http";
import type {
  MyProfilePostsResponse,
  ProfileImageCompleteResponse,
  ProfileImagePresignResponse,
  UpdateProfileResponse,
  UserProfile,
  UserProfileResponse,
} from "./types";

function normalizeUserProfileResponse(payload: UserProfileResponse | UserProfile) {
  const rawUser =
    payload && typeof payload === "object" && "user" in payload
      ? payload.user
      : payload;

  if (!rawUser || typeof rawUser !== "object") {
    throw new Error("PROFILE_RESPONSE_INVALID");
  }

  return {
    ok: payload && typeof payload === "object" && "ok" in payload ? payload.ok : true,
    user: rawUser as UserProfile,
  };
}

export async function getMyProfile() {
  const response = await request<UserProfileResponse | UserProfile>("/api/users/me/profile", { auth: true });
  return normalizeUserProfileResponse(response);
}

export function updateMyProfile(nickname: string) {
  return request<UpdateProfileResponse>("/api/users/me/profile", {
    method: "PATCH",
    body: { nickname },
    auth: true,
  });
}

export function presignMyProfileImage(file: File) {
  return request<ProfileImagePresignResponse>("/api/users/me/profile-image/presign", {
    method: "POST",
    body: {
      filename: file.name,
      contentType: file.type,
    },
    auth: true,
  });
}

export function completeMyProfileImage(key: string) {
  return request<ProfileImageCompleteResponse>("/api/users/me/profile-image/complete", {
    method: "POST",
    body: { key },
    auth: true,
  });
}

export async function putMyProfileImageToPresignedUrl(url: string, file: File) {
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`PROFILE_IMAGE_UPLOAD_FAILED ${response.status} ${body}`.trim());
  }
}

export function getMyPosts(page = 1, pageSize = 6) {
  const params = new URLSearchParams();
  params.set("page", String(Math.max(1, page)));
  params.set("pageSize", String(Math.max(1, pageSize)));

  return request<MyProfilePostsResponse>(`/api/v1/users/me/posts?${params.toString()}`, {
    auth: true,
  });
}
