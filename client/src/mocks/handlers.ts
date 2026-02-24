import { http, HttpResponse } from "msw";

type Upload = {
  id: number;
  status: string;
  createdAt: string;
  completedAt: string | null;
  userId?: number;
  originalFileKey?: string;
};

let uploads: Upload[] = [
  { id: 1, status: "UPLOADED", createdAt: new Date().toISOString(), completedAt: null },
];

export const handlers = [

  http.get("/api/health", () => {
    return HttpResponse.json({ ok: true, msg: "backend connected (mock)" });
  }),

  // auth
  http.post("/api/auth/login", async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    return HttpResponse.json({
      ok: true,
      message: "로그인 성공 (mock)",
      user: { id: 1, email: body.email },
      token: "mock-token",
    });
  }),

  // create upload
  http.post("/api/uploads", () => {
    const item: Upload = {
      id: Date.now(),
      status: "UPLOADED",
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    uploads = [item, ...uploads];
    console.log("[mock] CREATED upload, uploads length =", uploads.length);
    return HttpResponse.json({ ok: true, upload: item }, { status: 201 });
  }),


  http.get("/api/uploads/my", () => {
    console.log("[mock] HIT /api/uploads/my, uploads length =", uploads.length);
    return HttpResponse.json({ ok: true, uploads });
  }),

  // upload detail
  http.get("/api/uploads/:id", ({ params }) => {
    const id = Number(params.id);
    const found = uploads.find((u) => u.id === id);
    const fallback: Upload = {
      id,
      status: "UPLOADED",
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    return HttpResponse.json({ ok: true, upload: found ?? fallback });
  }),

  http.post("/api/auth/signup", async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    return HttpResponse.json(
        { ok: true, message: "회원가입 성공 (mock)", user: { id: Date.now(), email: body.email } },
        { status: 201 }
    );
  }),

  http.get("/api/admin/uploads", () => {
    return HttpResponse.json({ ok: true, uploads }, { status: 200 });
  }),

 
  http.post("/api/admin/uploads/:id/result", async ({ params, request }) => {
    const id = Number(params.id);
    const body = (await request.json()) as { resultFileKey?: string };

    const key = body.resultFileKey ?? "mock/result.glb";

    uploads = uploads.map((u) =>
        u.id === id
        ? {
            ...u,
            status: "COMPLETED",
            completedAt: new Date().toISOString(),
            resultFileKey: key,
            }
        : u
    );

    return HttpResponse.json({ ok: true, uploadId: id, resultFileKey: key }, { status: 201 });
  }),


];
