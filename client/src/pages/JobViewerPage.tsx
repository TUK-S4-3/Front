import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, HardDrive, Loader2, RefreshCw, Sparkles } from "lucide-react";
import type { JobStatus, JobViewerResponse } from "../api/types";
import { getJobViewer } from "../api/videos";
import Layout from "../components/Layout";
import PlyCanvasViewer from "../components/PlyCanvasViewer";

function normalizeJobStatus(status: string | null | undefined): JobStatus {
  const normalized = String(status ?? "").trim().toLowerCase();
  if (normalized === "ready" || normalized === "succeeded" || normalized === "success" || normalized === "done") {
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
  if (normalized === "submitted" || normalized === "queued") {
    return "queued";
  }
  return "queued";
}

function statusLabel(status: JobStatus) {
  if (status === "queued") return "Queued";
  if (status === "processing") return "Processing";
  if (status === "ready") return "Ready";
  if (status === "failed") return "Failed";
  return "Canceled";
}

function mapViewerFetchError(error: unknown) {
  const message = String(error instanceof Error ? error.message : error);
  if (message.includes("HTTP 401")) return "로그인이 필요합니다.";
  if (message.includes("HTTP 403")) return "해당 Job에 접근 권한이 없습니다.";
  if (message.includes("HTTP 404")) return "Job 또는 결과를 찾을 수 없습니다.";
  return "Viewer 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

export default function JobViewerPage() {
  const nav = useNavigate();
  const { sceneId, jobId } = useParams();
  const sceneIdText = String(sceneId ?? "");
  const jobIdText = String(jobId ?? "");

  const [viewer, setViewer] = useState<JobViewerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const fetchViewer = useCallback(async () => {
    if (!jobIdText) {
      setErr("유효하지 않은 Job ID입니다.");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await getJobViewer(jobIdText);
      setViewer(response);

      if (sceneIdText && String(response.sceneId) !== sceneIdText) {
        setErr("요청한 Scene과 Job의 Scene이 일치하지 않습니다.");
        return;
      }

      setErr("");
    } catch (caught) {
      const message = mapViewerFetchError(caught);
      setErr(message);
      if (message.includes("로그인이 필요합니다.") || message.includes("접근 권한이 없습니다.")) {
        nav("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [jobIdText, nav, sceneIdText]);

  useEffect(() => {
    if (!sceneIdText) {
      setErr("유효하지 않은 Scene ID입니다.");
      setLoading(false);
      return;
    }

    void fetchViewer();
  }, [sceneIdText, fetchViewer]);

  const currentStatus = useMemo(() => normalizeJobStatus(viewer?.status), [viewer?.status]);
  const sceneMatched = useMemo(
    () => (viewer ? String(viewer.sceneId) === sceneIdText : true),
    [viewer, sceneIdText]
  );
  const isReady = currentStatus === "ready" && !!viewer?.resultUrl;

  useEffect(() => {
    if (!viewer) return undefined;
    if (currentStatus !== "queued" && currentStatus !== "processing") return undefined;

    const timer = window.setInterval(() => {
      void fetchViewer();
    }, 4000);

    return () => {
      window.clearInterval(timer);
    };
  }, [viewer, currentStatus, fetchViewer]);

  return (
    <Layout>
      <div className="bg-[#F2F0EB] min-h-screen pt-28 pb-20 px-6 relative text-[#2D2D2D]">
        <div className="max-w-6xl mx-auto space-y-12 relative z-10">
          <div className="flex items-center justify-between">
            <Link
              to={`/uploads/${encodeURIComponent(sceneIdText)}`}
              className="group flex items-center gap-3 text-[#1A3C34]/40 hover:text-[#1A3C34] transition-colors font-bold text-[11px] uppercase tracking-widest"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Return to Scene
            </Link>

            <button
              onClick={() => void fetchViewer()}
              className="text-[#1A3C34]/40 hover:text-[#D95F39] transition-colors"
              aria-label="viewer refresh"
            >
              <RefreshCw size={18} />
            </button>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-[#1A3C34]/10 pb-12">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 text-[#D95F39] text-[11px] font-black uppercase tracking-[0.3em]">
                <Sparkles size={14} /> Job Viewer
              </div>
              <h1 className="text-5xl md:text-7xl font-serif italic tracking-tight">
                3D <span className="font-sans not-italic font-black text-[#1A3C34] uppercase">Result</span>
              </h1>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold bg-[#1A3C34] text-[#F2F0EB] px-3 py-1 uppercase tracking-tighter">
                  Scene ID: {sceneIdText}
                </span>
                <span className="text-[10px] font-bold text-[#1A3C34]/40 uppercase tracking-widest border-l border-[#1A3C34]/20 pl-3">
                  Job {jobIdText}
                </span>
              </div>
            </div>
          </div>

          {err && (
            <div className="bg-[#D95F39]/10 border border-[#D95F39]/20 p-6 flex items-center gap-4 text-[#D95F39] text-xs font-black uppercase tracking-widest">
              <AlertCircle size={20} /> {err}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8 space-y-8">
              <div className="relative aspect-video bg-white border border-[#1A3C34]/10 overflow-hidden">
                {loading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center p-12">
                    <Loader2 className="h-10 w-10 text-[#1A3C34]/20 animate-spin" />
                    <p className="text-[12px] font-bold uppercase tracking-[0.3em] text-[#1A3C34]/30">
                      Loading Viewer Data...
                    </p>
                  </div>
                ) : isReady && sceneMatched && viewer?.resultUrl ? (
                  <PlyCanvasViewer key={viewer.jobId} url={viewer.resultUrl} />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12">
                    <div className="mx-auto h-20 w-20 bg-[#F2F0EB] flex items-center justify-center text-[#1A3C34] border border-[#1A3C34]/10">
                      <HardDrive size={34} className={currentStatus === "processing" || currentStatus === "queued" ? "animate-pulse" : ""} />
                    </div>
                    <h3 className="mt-6 text-3xl font-serif italic text-[#1A3C34]">
                      {sceneMatched ? statusLabel(currentStatus) : "Scene Mismatch"}
                    </h3>
                    <p className="mt-2 text-[#1A3C34]/50 text-[13px] font-medium max-w-xs mx-auto leading-relaxed">
                      {!sceneMatched
                        ? "요청한 Scene 경로와 Viewer 응답의 sceneId가 다릅니다."
                        : currentStatus === "processing" || currentStatus === "queued"
                        ? "선택한 Job의 결과를 생성 중입니다."
                        : currentStatus === "failed"
                        ? "Job 처리에 실패했습니다. Scene 페이지에서 새 Job을 생성해 주세요."
                        : currentStatus === "canceled"
                        ? "해당 Job은 취소되었습니다."
                        : "뷰어에 표시할 결과 파일이 없습니다."}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="bg-[#1A3C34] p-10 text-[#F2F0EB] space-y-4">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D95F39]">
                  Viewer Status
                </div>
                <div className="text-[13px] leading-relaxed opacity-80 font-medium">
                  Current status: <span className="font-bold">{statusLabel(currentStatus)}</span>
                </div>
                <div className="text-[11px] opacity-70 font-medium space-y-1">
                  <div>Scene match: {sceneMatched ? "yes" : "no"}</div>
                  <div>Result URL: {viewer?.resultUrl ? "available" : "null"}</div>
                </div>
                {viewer?.file && (
                  <div className="text-[11px] opacity-70 font-medium space-y-1">
                    <div>Size: {viewer.file.contentLength.toLocaleString()} bytes</div>
                    <div>ETag: {viewer.file.etag}</div>
                    <div>Range: {viewer.file.acceptRanges ? "enabled" : "disabled"}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
