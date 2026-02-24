import { request } from "./http";
import type { LoginResponse, SessionResponse, SignupResponse } from "./types";

export async function login(payload: { email: string; password: string }) {
  return request<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: payload,
  });
}
export async function signup(email: string, password: string) {
  const res = await request<SignupResponse>("/api/auth/signup", {
    method: "POST",
    body: { email, password },
  });
  return res;
}

export async function me() {
  return request<SessionResponse>("/api/auth/me");
}

export async function logout() {
  return request<{ ok?: boolean; message?: string }>("/api/auth/logout", {
    method: "POST",
  });
}
