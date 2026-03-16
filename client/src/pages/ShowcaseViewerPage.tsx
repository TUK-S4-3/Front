import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Download,
  HardDrive,
  Heart,
  Loader2,
  RefreshCw,
  UserRound,
} from "lucide-react";
import GaussianSplatViewer from "../components/GaussianSplatViewer";
import { Button } from "../components/ui/button";
import { getPublicPostViewer, type PublicPostViewer } from "../api/public";

type PublicViewerStatus = "queued" | "processing" | "ready" | "failed" | "canceled";

function normalizeStatus(status: string | null | undefined): PublicViewerStatus {
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
  return "queued";
}

function statusLabel(status: PublicViewerStatus) {
  if (status === "queued") return "Queued";
  if (status === "processing") return "Processing";
  if (status === "ready") return "Ready";
  if (status === "failed") return "Failed";
  return "Canceled";
}

function mapViewerFetchError(error: unknown) {
  const message = String(error instanceof Error ? error.message : error);
  if (message.includes("HTTP 404")) return "게시물을 찾을 수 없습니다.";
  return "공개 viewer 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

function isViewerReady(viewer: PublicPostViewer | null) {
  if (!viewer || !viewer.resultUrl) return false;
  if (typeof viewer.viewerReady === "boolean") {
    return viewer.viewerReady;
  }
  return normalizeStatus(viewer.status) === "ready";
}

const DOWNLOAD_ITEMS = [
  {
    id: "input-video",
    title: "input video",
    description: "원본 입력 비디오",
  },
  {
    id: "log",
    title: "log",
    description: "처리 로그 파일",
  },
  {
    id: "sfm",
    title: "SfM",
    description: "Structure from Motion 결과",
  },
  {
    id: "gaussian-splatting",
    title: "Gaussian Splatting",
    description: "가우시안 스플래팅 결과",
  },
] as const;

export default function ShowcaseViewerPage() {
  const { id } = useParams();
  const postIdText = String(id ?? "");

  const [viewer, setViewer] = useState<PublicPostViewer | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const downloadMenuRef = useRef<HTMLDivElement | null>(null);

  const fetchViewer = useCallback(async () => {
    if (!postIdText) {
      setErr("유효하지 않은 게시물 ID입니다.");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await getPublicPostViewer(postIdText);
      setViewer(response);
      setErr("");
    } catch (caught) {
      setErr(mapViewerFetchError(caught));
    } finally {
      setLoading(false);
    }
  }, [postIdText]);

  useEffect(() => {
    void fetchViewer();
  }, [fetchViewer]);

  useEffect(() => {
    setDownloadMenuOpen(false);
  }, [postIdText]);

  const currentStatus = useMemo(() => normalizeStatus(viewer?.status), [viewer?.status]);
  const ready = useMemo(() => isViewerReady(viewer), [viewer]);
  const fileContentLength =
    viewer?.file && typeof viewer.file.contentLength === "number" ? viewer.file.contentLength : null;
  const fileAcceptRanges =
    viewer?.file && typeof viewer.file.acceptRanges === "boolean" ? viewer.file.acceptRanges : null;
  const shouldPoll = currentStatus === "queued" || currentStatus === "processing";

  useEffect(() => {
    if (!shouldPoll) return undefined;

    const timer = window.setInterval(() => {
      void fetchViewer();
    }, 4000);

    return () => {
      window.clearInterval(timer);
    };
  }, [fetchViewer, shouldPoll]);

  useEffect(() => {
    if (!downloadMenuOpen) return undefined;

    function handlePointerDown(event: MouseEvent) {
      if (!downloadMenuRef.current?.contains(event.target as Node)) {
        setDownloadMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [downloadMenuOpen]);

  const viewerContent = (
    <div className="fixed inset-0 z-[9999] bg-[#090B0E] text-white overflow-hidden">
      <div className="relative h-full">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-12 pb-12 pt-44 md:pt-56">
            <Loader2 className="h-10 w-10 text-white/40 animate-spin" />
            <p className="text-[12px] font-bold uppercase tracking-[0.3em] text-white/60">Loading Public Viewer...</p>
          </div>
        ) : ready && viewer?.resultUrl ? (
          <GaussianSplatViewer key={String(viewer.postId)} url={viewer.resultUrl} showControlsHint={false} />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-12 pb-12 pt-44 md:pt-56">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(217,95,57,0.18),_transparent_35%),linear-gradient(145deg,_#11161C_0%,_#090B0E_55%,_#040506_100%)]" />
            <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:40px_40px]" />
            <div className="relative mx-auto max-w-xl">
              <div className="mx-auto h-20 w-20 bg-white/10 flex items-center justify-center text-white border border-white/20 rounded-full">
                <HardDrive size={34} className={shouldPoll ? "animate-pulse" : ""} />
              </div>
              <h3 className="mt-6 text-3xl font-serif italic">{statusLabel(currentStatus)}</h3>
              <p className="mt-3 text-white/65 text-[13px] font-medium max-w-sm mx-auto leading-relaxed">
                {currentStatus === "processing" || currentStatus === "queued"
                  ? "게시된 결과를 준비 중입니다. 잠시 후 다시 확인해 주세요."
                  : currentStatus === "failed"
                  ? "현재 공개 viewer를 불러올 수 없습니다."
                  : currentStatus === "canceled"
                  ? "이 게시물의 결과 생성이 취소되었습니다."
                  : "공개 viewer에 표시할 결과 파일이 아직 준비되지 않았습니다."}
              </p>
              <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                Public Post {viewer?.postId ?? postIdText}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 p-4 md:p-6 space-y-3">
        <div className="pointer-events-auto flex flex-col gap-4 rounded-2xl border border-white/15 bg-black/45 px-4 py-4 backdrop-blur-sm md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <Link
              to="/showcase"
              className="group inline-flex items-center gap-2 text-white/75 hover:text-white transition-colors font-bold text-[11px] uppercase tracking-widest"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Return to Showcase
            </Link>

            <div className="space-y-2">
              <h1 className="text-2xl font-serif italic text-white md:text-4xl">
                {viewer?.title ?? `Public Post ${postIdText}`}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-[0.18em] text-white/55">
                <span className="inline-flex items-center gap-2">
                  <UserRound size={14} />
                  {viewer?.authorName ?? "Unknown Author"}
                </span>
                {viewer?.sceneId != null && <span>Scene {viewer.sceneId}</span>}
                {viewer?.jobId != null && <span>Job {viewer.jobId}</span>}
                <span className="rounded-full border border-[#D95F39]/35 bg-[#D95F39]/15 px-3 py-1 text-[#FFD2C5]">
                  {statusLabel(currentStatus)}
                </span>
                {viewer?.isOwner && (
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-white/70">
                    Your Post
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-stretch gap-2 md:items-end">
            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              <Button
                type="button"
                disabled
                className="h-10 rounded-full border border-white/15 bg-white/10 px-4 text-[11px] font-black uppercase tracking-[0.18em] text-white/80 disabled:pointer-events-none disabled:opacity-100"
              >
                <Heart size={14} />
                좋아요
                <span className="ml-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/85">
                  {viewer?.likeCount ?? 0}
                </span>
              </Button>
              <div ref={downloadMenuRef} className="relative">
                <Button
                  type="button"
                  onClick={() => setDownloadMenuOpen((prev) => !prev)}
                  aria-expanded={downloadMenuOpen}
                  aria-haspopup="menu"
                  className="h-10 rounded-full border border-white/15 bg-white/10 px-4 text-[11px] font-black uppercase tracking-[0.18em] text-white/80 hover:bg-white/15"
                >
                  <Download size={14} />
                  다운로드
                  <span className="ml-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/85">
                    {viewer?.downloadCount ?? 0}
                  </span>
                </Button>
                {downloadMenuOpen && (
                  <div className="absolute right-0 top-[calc(100%+0.5rem)] w-[280px] overflow-hidden rounded-2xl border border-white/15 bg-[#101317]/95 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-md">
                    <div className="border-b border-white/10 px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/45">Download Files</p>
                    </div>
                    <div className="p-2">
                      {DOWNLOAD_ITEMS.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-white/5"
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-white">{item.title}</div>
                            <div className="mt-1 text-[11px] text-white/45">{item.description}</div>
                          </div>
                          <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
                            File
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => void fetchViewer()}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/80 transition-colors hover:border-[#D95F39]/45 hover:bg-[#D95F39]/20 hover:text-white"
                aria-label="public viewer refresh"
              >
                <RefreshCw size={18} />
              </button>
            </div>

            <div className="text-[10px] font-medium tracking-wide text-white/55">
              Likes {viewer?.likeCount ?? 0} | Downloads {viewer?.downloadCount ?? 0}
            </div>
          </div>
        </div>

        <div className="pointer-events-auto ml-auto flex max-w-full flex-wrap items-center justify-end gap-2">
          <div className="rounded-full border border-white/15 bg-black/35 px-4 py-2 text-[10px] font-medium leading-relaxed tracking-wide text-white/68">
            좌클릭 드래그: 회전 / 우클릭+드래그: 이동 / 휠: 줌 / Q,E: 화면 기울기
          </div>
          {viewer?.file && (
            <div className="rounded-full border border-white/15 bg-black/35 px-4 py-2 text-[10px] font-medium tracking-wide text-white/60">
              Size {fileContentLength !== null ? fileContentLength.toLocaleString() : "-"} bytes | Range{" "}
              {fileAcceptRanges === null ? "-" : fileAcceptRanges ? "enabled" : "disabled"}
            </div>
          )}
        </div>

        {err && (
          <div className="pointer-events-auto rounded-xl border border-[#D95F39]/40 bg-[#D95F39]/15 px-4 py-3 text-xs font-bold uppercase tracking-widest text-[#FFB8A4]">
            <div className="flex items-center gap-3">
              <AlertCircle size={18} />
              {err}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(viewerContent, document.body);
}
