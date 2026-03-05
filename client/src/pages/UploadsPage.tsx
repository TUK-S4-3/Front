import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { completeVideo, getMyScenes, presignVideo, putVideoToPresignedUrl } from "../api/videos";
import type { VideoScene } from "../api/types";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import {
  UploadCloud, RefreshCw, FileText,
  CheckCircle2,
  Layers, HardDrive, Sparkles
} from "lucide-react";

type UploadFlowState = "idle" | "presigning" | "uploading" | "completing" | "success" | "error";

function mapUploadError(error: unknown) {
  const message = String(error instanceof Error ? error.message : error);

  if (message.includes("HTTP 400") && message.includes("지원하지 않는 영상 형식")) {
    return "mp4 파일만 업로드 가능합니다.";
  }
  if (message.includes("HTTP 400") && message.includes("업로드된 영상을 찾을 수 없습니다")) {
    return "업로드가 완료되지 않았습니다. 다시 시도해 주세요.";
  }
  if (message.includes("HTTP 401")) {
    return "로그인이 필요합니다.";
  }
  if (message.includes("HTTP 403")) {
    return "해당 업로드에 대한 권한이 없습니다.";
  }
  if (message.includes("HTTP 404")) {
    return "업로드 세션이 만료되었거나 유효하지 않습니다.";
  }
  if (message.includes("HTTP 409")) {
    return "이미 완료 처리된 업로드입니다.";
  }
  if (message.includes("S3_UPLOAD_FAILED")) {
    return "S3 업로드에 실패했습니다. 잠시 후 다시 시도해 주세요.";
  }
  return "업로드 중 오류가 발생했습니다. 다시 시도해 주세요.";
}

function mapSceneFetchError(error: unknown) {
  const message = String(error instanceof Error ? error.message : error);

  if (message.includes("HTTP 401")) {
    return "로그인이 필요합니다.";
  }
  if (message.includes("HTTP 400")) {
    return "업로드 목록 조회 파라미터가 올바르지 않습니다.";
  }
  return "내 업로드 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

function normalizeSceneStatus(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "completed" || normalized === "succeeded" || normalized === "ready") {
    return "ready";
  }
  if (normalized === "processing" || normalized === "running") {
    return "processing";
  }
  if (normalized === "failed") {
    return "failed";
  }
  if (normalized === "canceled" || normalized === "cancelled") {
    return "canceled";
  }
  return "queued";
}

function stateMessage(state: UploadFlowState, progress: number, sceneId: string) {
  if (state === "presigning") return "업로드 준비 중…";
  if (state === "uploading") return `S3 업로드 중… ${progress}%`;
  if (state === "completing") return "업로드 완료 처리 중…";
  if (state === "success" && sceneId) return `업로드 완료 (sceneId: ${sceneId})`;
  return "";
}

export default function UploadsPage() {
  const nav = useNavigate();
  const [scenes, setScenes] = useState<VideoScene[]>([]);
  const [err, setErr] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadFlowState>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [successSceneId, setSuccessSceneId] = useState("");
  const [sceneTitle, setSceneTitle] = useState("");

  const isUploading = uploadState === "presigning" || uploadState === "uploading" || uploadState === "completing";
  const statusText = stateMessage(uploadState, uploadProgress, successSceneId);
  const alertText = uploadState === "error" ? err : statusText || err;

  const stats = useMemo(() => ({
    total: scenes.length,
    completed: scenes.filter(scene => normalizeSceneStatus(scene.status) === "ready").length,
    processing: scenes.filter(scene => normalizeSceneStatus(scene.status) === "processing").length,
  }), [scenes]);

  const fetchScenes = useCallback(async () => {
    try {
      const res = await getMyScenes(1);
      setScenes(Array.isArray(res.items) ? res.items : []);
      setErr("");
    } catch (e: unknown) {
      setErr(mapSceneFetchError(e));
    }
  }, []);

  useEffect(() => {
    void fetchScenes();
  }, [fetchScenes]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
    setErr("");
    setUploadState("idle");
    setUploadProgress(0);
    setSuccessSceneId("");
  };

  const handleUpload = async () => {
    if (!file) return;
    const isMp4Mime = file.type === "video/mp4";
    const isMp4Ext = file.name.toLowerCase().endsWith(".mp4");
    if (!isMp4Mime && !isMp4Ext) {
      setUploadState("error");
      setErr("mp4 파일만 업로드 가능합니다.");
      return;
    }
    const contentType = isMp4Mime ? file.type : "video/mp4";
    const title = sceneTitle.trim() || "Untitled Scene";

    setErr("");
    setUploadState("presigning");
    setUploadProgress(0);
    setSuccessSceneId("");

    try {
      const presign = await presignVideo({
        filename: file.name,
        contentType,
        title,
      });

      if (!presign.sceneId || !presign.key || !presign.url) {
        throw new Error("PRESIGN_RESPONSE_INVALID");
      }

      setUploadState("uploading");
      await putVideoToPresignedUrl(presign.url, file, contentType, setUploadProgress);

      setUploadState("completing");
      const complete = await completeVideo({
        sceneId: String(presign.sceneId),
        key: presign.key,
      });

      const nextSceneId = complete.sceneId || presign.sceneId;
      setUploadState("success");
      setUploadProgress(100);
      setSuccessSceneId(nextSceneId);
      await fetchScenes();
      setFile(null);
      setSceneTitle("");
    } catch (e: unknown) {
      setUploadState("error");
      setErr(mapUploadError(e));
    }
  };

  return (
    <Layout>

      <div className="min-h-screen bg-[#F2F0EB] text-[#2D2D2D] pt-28 pb-20 px-6 relative">
        <div className="max-w-6xl mx-auto space-y-12 relative z-10">
          
   
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#1A3C34]/10 pb-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 text-[#1A3C34]/40 text-[11px] font-bold uppercase tracking-[0.4em]">
                <Sparkles size={14} className="text-[#D95F39]" /> Studio Database
              </div>
              <h1 className="text-5xl md:text-7xl font-serif italic leading-none tracking-tight">
                Archive <span className="font-sans not-italic font-black text-[#1A3C34] uppercase">Manager</span>
              </h1>
            </div>

            <div className="text-[11px] font-black uppercase tracking-widest text-[#1A3C34]/40">
              Session Archive View
            </div>
          </div>


          <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
            <StatCard label="Total Assets" value={stats.total} icon={<Layers size={20} />} />
            <StatCard label="Processing" value={stats.processing} icon={<RefreshCw size={20} />} active />
            <StatCard label="Completed" value={stats.completed} icon={<CheckCircle2 size={20} />} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

            <div className="lg:col-span-5">
              <div className="bg-white border border-[#1A3C34]/10 p-10 space-y-8">
                <div>
                  <h3 className="text-[18px] font-black uppercase tracking-tighter text-[#1A3C34]">New Entry</h3>
                  <p className="text-[13px] opacity-50 font-medium mt-1">Select a video to begin 3D reconstruction.</p>
                </div>

                <div className="relative group">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept="video/mp4"
                    disabled={isUploading}
                    onClick={(e) => {
                      e.currentTarget.value = "";
                    }}
                    onChange={handleFileChange}
                  />
                  <label
                    htmlFor="file-upload"
                    className={`flex flex-col items-center justify-center aspect-video bg-[#F2F0EB] border border-dashed border-[#1A3C34]/20 transition-all group ${
                      isUploading ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:border-[#D95F39]"
                    }`}
                  >
                    <UploadCloud size={32} className="text-[#1A3C34]/20 group-hover:text-[#D95F39] transition-colors" />
                    <p className="mt-4 text-[11px] font-bold text-[#1A3C34]/40 uppercase tracking-widest group-hover:text-[#D95F39]">Browse Files</p>
                  </label>
                </div>

                {file && (
                  <div className="p-4 bg-[#F2F0EB] flex items-center gap-4 border-l-4 border-[#D95F39]">
                    <FileText size={18} className="text-[#1A3C34]" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold truncate uppercase">{file.name}</div>
                      <div className="text-[9px] text-[#1A3C34]/40 font-bold uppercase tracking-tighter">Ready to process</div>
                    </div>
                  </div>
                )}

                {(uploadState !== "idle" || !!err) && (
                  <div className={`p-4 border-l-4 ${uploadState === "error" ? "bg-[#D95F39]/10 border-[#D95F39]" : "bg-[#F2F0EB] border-[#1A3C34]/20"}`}>
                    <div className={`text-[11px] font-bold uppercase tracking-wide ${uploadState === "error" ? "text-[#D95F39]" : "text-[#1A3C34]/70"}`}>
                      {alertText}
                    </div>
                    {uploadState === "uploading" && (
                      <div className="mt-3 h-2 bg-[#1A3C34]/10">
                        <div
                          className="h-full bg-[#D95F39] transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}
                    {uploadState === "success" && (
                      <div className="mt-2 text-[10px] text-[#1A3C34]/60 font-bold uppercase tracking-wider">
                        영상 저장 완료
                      </div>
                    )}
                    {uploadState === "error" && file && (
                      <button
                        type="button"
                        onClick={handleUpload}
                        className="mt-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#D95F39] border-b border-[#D95F39]"
                      >
                        재시도
                      </button>
                    )}
                  </div>
                )}

                <div className="space-y-5 border border-[#1A3C34]/10 p-5 bg-[#F2F0EB]/60">
                  <div className="space-y-2">
                    <label htmlFor="scene-title" className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#1A3C34]/60">
                      Title
                    </label>
                    <input
                      id="scene-title"
                      type="text"
                      value={sceneTitle}
                      disabled={isUploading}
                      onChange={(e) => setSceneTitle(e.target.value)}
                      placeholder="Untitled Scene"
                      className="w-full h-11 px-3 bg-white border border-[#1A3C34]/20 text-[13px] font-medium text-[#1A3C34] placeholder:text-[#1A3C34]/30 focus:outline-none focus:border-[#D95F39]"
                    />
                  </div>
                </div>

                <Button
                  disabled={!file || isUploading}
                  onClick={handleUpload}
                  className="w-full h-16 rounded-none bg-[#1A3C34] hover:bg-[#D95F39] text-[#F2F0EB] font-black text-[13px] tracking-[0.2em] transition-all"
                >
                  {isUploading ? <RefreshCw className="animate-spin" /> : "INITIALIZE ARCHIVE"}
                </Button>
              </div>
            </div>


            <div className="lg:col-span-7">
              <div className="bg-white border border-[#1A3C34]/10">
                <table className="w-full text-left">
                  <thead className="bg-[#1A3C34] text-[10px] font-bold text-[#F2F0EB]/50 uppercase tracking-[0.2em]">
                    <tr>
                      <th className="px-8 py-5">Asset Identity</th>
                      <th className="px-4 py-5 text-center">Status</th>
                      <th className="px-8 py-5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A3C34]/5">
                    {scenes.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-24 text-center text-[#1A3C34]/20 font-bold uppercase tracking-[0.3em] text-sm">
                          No Session Uploads
                        </td>
                      </tr>
                    ) : (
                      scenes.map((scene) => (
                        <tr
                          key={scene.id}
                          className="group hover:bg-[#F2F0EB]/50 transition-colors cursor-pointer"
                          role="button"
                          tabIndex={0}
                          onClick={() => nav(`/uploads/${encodeURIComponent(String(scene.id))}`)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              nav(`/uploads/${encodeURIComponent(String(scene.id))}`);
                            }
                          }}
                        >
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-[#F2F0EB] flex items-center justify-center text-[#1A3C34] group-hover:bg-[#D95F39] group-hover:text-white transition-all">
                                <HardDrive size={18} />
                              </div>
                              <div>
                                <div className="text-[14px] font-black uppercase tracking-tighter text-[#1A3C34]">
                                  {scene.title?.trim() || `Scene ${scene.id}`}
                                </div>
                                <div className="text-[10px] opacity-30 font-bold uppercase">Stored Geometry</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-6 text-center">
                             <StatusTag status={scene.status} />
                          </td>
                          <td className="px-8 py-6 text-right text-[10px] font-bold uppercase tracking-wider text-[#1A3C34]/35">
                            sceneId {scene.id}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ label, value, icon, active }: { label: string; value: number; icon: ReactNode; active?: boolean }) {
  return (
    <div className={`p-8 border border-[#1A3C34]/10 transition-all ${active ? 'bg-[#1A3C34] text-[#F2F0EB]' : 'bg-white text-[#2D2D2D]'}`}>
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className={`text-[10px] font-bold uppercase tracking-[0.2em] ${active ? 'text-[#F2F0EB]/40' : 'text-[#1A3C34]/30'}`}>{label}</div>
          <div className="text-5xl font-black tracking-tighter italic font-serif">{value}</div>
        </div>
        <div className={`w-10 h-10 flex items-center justify-center ${active ? 'text-[#D95F39]' : 'text-[#1A3C34]/20'}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function StatusTag({ status }: { status: string }) {
  const config: Record<string, { label: string, color: string }> = {
    queued: { label: "Queued", color: "bg-[#F2F0EB] text-[#1A3C34]/40" },
    processing: { label: "Synthesizing", color: "border border-[#1A3C34] text-[#1A3C34] animate-pulse" },
    ready: { label: "Archived", color: "bg-[#1A3C34] text-[#F2F0EB]" },
    failed: { label: "System Error", color: "bg-[#D95F39] text-white" },
    canceled: { label: "Canceled", color: "border border-[#D95F39] text-[#D95F39]" },
  };
  const c = config[normalizeSceneStatus(status)] || config.queued;
  return (
    <span className={`px-4 py-1 text-[9px] font-black uppercase tracking-[0.15em] ${c.color}`}>
      {c.label}
    </span>
  );
}
