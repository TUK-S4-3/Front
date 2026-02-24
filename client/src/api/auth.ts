import { request, setToken } from "./http";
import type { LoginResponse, SignupResponse } from "./types";

export async function login(payload: { email: string; password: string }) {
  const res = await request<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: payload,
  });
  setToken(res.token);
  return res;
}
export async function signup(email: string, password: string) {
  const res = await request<SignupResponse>("/api/auth/signup", {
    method: "POST",
    body: { email, password },
  });
  return res;
}
