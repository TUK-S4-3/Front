import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, HardDrive, Loader2, RefreshCw } from "lucide-react";
import type { JobStatus, JobViewerResponse } from "../api/types";
import { getJobViewer } from "../api/videos";
import GaussianSplatViewer from "../components/GaussianSplatViewer";

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
  const fileContentLength =
    viewer?.file && typeof viewer.file.contentLength === "number" ? viewer.file.contentLength : null;
  const fileAcceptRanges =
    viewer?.file && typeof viewer.file.acceptRanges === "boolean" ? viewer.file.acceptRanges : null;

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

  const viewerContent = (
    <div className="fixed inset-0 bg-[#090B0E] text-white overflow-hidden z-[9999]">
      {loading ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center p-12">
          <Loader2 className="h-10 w-10 text-white/40 animate-spin" />
          <p className="text-[12px] font-bold uppercase tracking-[0.3em] text-white/60">Loading Viewer Data...</p>
        </div>
      ) : isReady && sceneMatched && viewer?.resultUrl ? (
        <GaussianSplatViewer key={viewer.jobId} url={viewer.resultUrl} />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12">
          <div className="mx-auto h-20 w-20 bg-white/10 flex items-center justify-center text-white border border-white/20 rounded-full">
            <HardDrive size={34} className={currentStatus === "processing" || currentStatus === "queued" ? "animate-pulse" : ""} />
          </div>
          <h3 className="mt-6 text-3xl font-serif italic">{sceneMatched ? statusLabel(currentStatus) : "Scene Mismatch"}</h3>
          <p className="mt-2 text-white/65 text-[13px] font-medium max-w-sm mx-auto leading-relaxed">
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

      <div className="pointer-events-none absolute inset-x-0 top-0 p-4 md:p-6 space-y-3">
        <div className="pointer-events-auto flex items-center justify-between gap-4 bg-black/45 border border-white/20 px-4 py-3 backdrop-blur-sm rounded-md">
          <Link
            to={`/uploads/${encodeURIComponent(sceneIdText)}`}
            className="group flex items-center gap-2 text-white/80 hover:text-white transition-colors font-bold text-[11px] uppercase tracking-widest"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Return to Scene
          </Link>

          <div className="hidden md:flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em]">
            <span className="px-2 py-1 bg-white/10 border border-white/20">Scene {sceneIdText}</span>
            <span className="px-2 py-1 bg-white/10 border border-white/20">Job {jobIdText}</span>
            <span className="px-2 py-1 bg-[#D95F39]/20 border border-[#D95F39]/40 text-[#FFB8A4]">
              {statusLabel(currentStatus)}
            </span>
          </div>

          <button
            onClick={() => void fetchViewer()}
            className="text-white/70 hover:text-[#FFB8A4] transition-colors"
            aria-label="viewer refresh"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        {viewer?.file && (
          <div className="text-[10px] font-medium tracking-wide text-white/60 px-3 py-2 bg-black/35 border border-white/15 rounded-md w-fit ml-auto">
            Size {fileContentLength !== null ? fileContentLength.toLocaleString() : "-"} bytes | Range{" "}
            {fileAcceptRanges === null ? "-" : fileAcceptRanges ? "enabled" : "disabled"}
          </div>
        )}

        {err && (
          <div className="pointer-events-auto bg-[#D95F39]/15 border border-[#D95F39]/40 px-4 py-3 flex items-center gap-3 text-[#FFB8A4] text-xs font-bold uppercase tracking-widest rounded-md">
            <AlertCircle size={18} /> {err}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(viewerContent, document.body);
}
