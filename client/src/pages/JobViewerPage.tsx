import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, Camera, HardDrive, Loader2, RefreshCw, Share2 } from "lucide-react";
import type { JobStatus, JobViewerResponse } from "../api/types";
import { getPublicPostViewer } from "../api/public";
import { getJobViewer } from "../api/videos";
import {
  completePostThumbnail,
  createPost,
  presignPostThumbnail,
  putPostThumbnailToPresignedUrl,
} from "../api/posts";
import GaussianSplatViewer, { type GaussianSplatViewerHandle } from "../components/GaussianSplatViewer";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

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

function mapCreatePostError(error: unknown) {
  const message = String(error instanceof Error ? error.message : error);
  if (message.includes("HTTP 401")) {
    return "로그인이 필요합니다.";
  }
  if (message.includes("HTTP 400") && message.includes("JOB_NOT_VIEWABLE")) {
    return "현재 Job은 게시할 수 없습니다. viewer 상태를 다시 확인해 주세요.";
  }
  if (message.includes("HTTP 400") && message.includes("BAD_REQUEST")) {
    return "제목은 100자 이하로 입력해 주세요.";
  }
  if (message.includes("HTTP 403")) {
    return "해당 Job을 게시할 권한이 없습니다.";
  }
  if (message.includes("HTTP 404") && message.includes("JOB_NOT_FOUND")) {
    return "게시할 Job을 찾을 수 없습니다.";
  }
  if (message.includes("HTTP 409") && message.includes("POST_ALREADY_EXISTS")) {
    return "이미 게시된 Job입니다.";
  }
  return "게시 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.";
}

function isViewerReady(viewer: JobViewerResponse | null) {
  if (!viewer || !viewer.resultUrl) return false;
  if (typeof viewer.viewerReady === "boolean") {
    return viewer.viewerReady;
  }
  return normalizeJobStatus(viewer.status) === "ready";
}

function stopEventPropagation(event: Event) {
  event.stopPropagation();
  event.stopImmediatePropagation?.();
}

function mapThumbnailError(error: unknown) {
  const message = String(error instanceof Error ? error.message : error);
  if (message.includes("HTTP 401")) return "로그인이 필요합니다.";
  if (message.includes("HTTP 403")) return "썸네일을 수정할 권한이 없습니다.";
  if (message.includes("HTTP 404")) return "게시물 또는 Job을 찾을 수 없습니다.";
  if (message.includes("HTTP 400")) return "썸네일은 10MB 이하 JPEG 파일만 저장할 수 있습니다.";
  if (message.includes("THUMBNAIL_UPLOAD_FAILED")) return "썸네일 업로드에 실패했습니다. 잠시 후 다시 시도해 주세요.";
  if (message.includes("THUMBNAIL_CAPTURE_EMPTY")) return "현재 viewer 화면을 캡처하지 못했습니다. 잠시 후 다시 시도해 주세요.";
  if (message.includes("THUMBNAIL_CANVAS_NOT_FOUND") || message.includes("THUMBNAIL_CANVAS_NOT_READY")) {
    return "viewer가 아직 준비되지 않았습니다. 모델이 모두 로드된 뒤 다시 시도해 주세요.";
  }
  if (message.includes("Tainted canvases may not be exported") || message.includes("SecurityError")) {
    return "브라우저 보안 정책으로 viewer 캡처가 차단되었습니다. CORS 설정을 확인해 주세요.";
  }
  return "썸네일 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.";
}

const THUMBNAIL_MAX_BYTES = 10 * 1024 * 1024;

export default function JobViewerPage() {
  const nav = useNavigate();
  const { sceneId, jobId } = useParams();
  const sceneIdText = String(sceneId ?? "");
  const jobIdText = String(jobId ?? "");

  const [viewer, setViewer] = useState<JobViewerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [publishTitle, setPublishTitle] = useState("");
  const [publishError, setPublishError] = useState("");
  const [posting, setPosting] = useState(false);
  const [postFeedback, setPostFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [thumbnailSaving, setThumbnailSaving] = useState(false);
  const [thumbnailFeedback, setThumbnailFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [republishAvailable, setRepublishAvailable] = useState(false);
  const [republishChecking, setRepublishChecking] = useState(false);
  const publishDialogRef = useRef<HTMLDivElement | null>(null);
  const viewerHandleRef = useRef<GaussianSplatViewerHandle | null>(null);

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
  const isReady = useMemo(() => isViewerReady(viewer), [viewer]);
  const canPublish = useMemo(
    () => (Boolean(viewer?.postable) || republishAvailable) && sceneMatched && isReady && !republishChecking,
    [viewer?.postable, republishAvailable, sceneMatched, isReady, republishChecking]
  );
  const canManageThumbnail = useMemo(
    () =>
      Boolean(viewer?.postId) &&
      Boolean(viewer?.isOwner) &&
      sceneMatched &&
      isReady &&
      !republishAvailable &&
      !republishChecking,
    [viewer?.isOwner, viewer?.postId, sceneMatched, isReady, republishAvailable, republishChecking]
  );
  const trimmedPublishTitle = publishTitle.trim();
  const canSubmitPost = Boolean(viewer?.jobId) && canPublish && trimmedPublishTitle.length > 0 && !posting;
  const fileContentLength =
    viewer?.file && typeof viewer.file.contentLength === "number" ? viewer.file.contentLength : null;
  const fileAcceptRanges =
    viewer?.file && typeof viewer.file.acceptRanges === "boolean" ? viewer.file.acceptRanges : null;

  useEffect(() => {
    let canceled = false;

    if (!viewer?.isOwner || !viewer?.postId || !isReady || !sceneMatched || viewer?.postable) {
      setRepublishAvailable(false);
      setRepublishChecking(false);
      return undefined;
    }

    setRepublishChecking(true);

    void getPublicPostViewer(viewer.postId)
      .then(() => {
        if (canceled) return;
        setRepublishAvailable(false);
      })
      .catch((caught) => {
        if (canceled) return;
        const message = String(caught instanceof Error ? caught.message : caught);
        setRepublishAvailable(message.includes("HTTP 404"));
      })
      .finally(() => {
        if (canceled) return;
        setRepublishChecking(false);
      });

    return () => {
      canceled = true;
    };
  }, [viewer?.isOwner, viewer?.postId, viewer?.postable, isReady, sceneMatched]);

  useEffect(() => {
    if (!canPublish) {
      setIsPublishOpen(false);
    }
  }, [canPublish]);

  useEffect(() => {
    if (!isPublishOpen) return undefined;

    const handleWindowKeyEvent = (event: KeyboardEvent) => {
      const dialog = publishDialogRef.current;
      const target = event.target;
      if (!dialog || !(target instanceof Node) || !dialog.contains(target)) {
        return;
      }

      stopEventPropagation(event);
    };

    window.addEventListener("keydown", handleWindowKeyEvent, true);
    window.addEventListener("keyup", handleWindowKeyEvent, true);
    window.addEventListener("keypress", handleWindowKeyEvent, true);

    return () => {
      window.removeEventListener("keydown", handleWindowKeyEvent, true);
      window.removeEventListener("keyup", handleWindowKeyEvent, true);
      window.removeEventListener("keypress", handleWindowKeyEvent, true);
    };
  }, [isPublishOpen]);

  const handleOpenPublish = () => {
    setPublishTitle("");
    setPublishError("");
    setPostFeedback(null);
    setIsPublishOpen(true);
  };

  const handleClosePublish = () => {
    if (posting) return;
    setPublishError("");
    setIsPublishOpen(false);
  };

  const handleCreatePost = useCallback(async () => {
    if (!viewer?.jobId || posting) return;
    if (!trimmedPublishTitle) {
      setPublishError("제목을 입력해 주세요.");
      return;
    }

    setPosting(true);
    setPublishError("");
    setPostFeedback(null);

    try {
      const created = await createPost({
        jobId: viewer.jobId,
        title: trimmedPublishTitle,
      });

      setIsPublishOpen(false);
      setPublishTitle("");
      setPublishError("");
      setPostFeedback({
        type: "success",
        text: `게시가 완료되었습니다. 제목: ${created.title}`,
      });
      await fetchViewer();
    } catch (caught) {
      const message = mapCreatePostError(caught);
      setPostFeedback({ type: "error", text: message });

      if (message.includes("로그인이 필요합니다.") || message.includes("권한이 없습니다.")) {
        nav("/login");
        return;
      }

      if (message.includes("이미 게시된 Job입니다.") || message.includes("게시할 수 없습니다.")) {
        setIsPublishOpen(false);
        await fetchViewer();
      }
    } finally {
      setPosting(false);
    }
  }, [fetchViewer, nav, posting, trimmedPublishTitle, viewer?.jobId]);

  const handleSaveThumbnail = useCallback(async () => {
    if (!viewer?.postId || !viewer?.isOwner || !isReady || !sceneMatched || thumbnailSaving) return;

    setThumbnailSaving(true);
    setThumbnailFeedback(null);

    try {
      const blob = await viewerHandleRef.current?.captureJpegBlob();
      if (!blob) {
        throw new Error("THUMBNAIL_CANVAS_NOT_FOUND");
      }
      if (blob.size > THUMBNAIL_MAX_BYTES) {
        throw new Error("HTTP 400 THUMBNAIL_TOO_LARGE");
      }

      const presigned = await presignPostThumbnail(viewer.postId);
      if (!presigned.uploadUrl || !presigned.key) {
        throw new Error("THUMBNAIL_PRESIGN_INVALID");
      }

      await putPostThumbnailToPresignedUrl(presigned.uploadUrl, blob);
      const completed = await completePostThumbnail(viewer.postId, presigned.key);

      setViewer((current) =>
        current
          ? {
              ...current,
              thumbnailUrl: completed.thumbnailUrl,
              thumbnailUpdatedAt: completed.thumbnailUpdatedAt,
            }
          : current
      );
      setThumbnailFeedback({ type: "success", text: "현재 화면을 썸네일로 저장했습니다." });
    } catch (caught) {
      setThumbnailFeedback({ type: "error", text: mapThumbnailError(caught) });
    } finally {
      setThumbnailSaving(false);
    }
  }, [isReady, sceneMatched, thumbnailSaving, viewer?.isOwner, viewer?.postId]);

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
    <div className="fixed inset-0 z-[9999] bg-[#090B0E] text-white overflow-hidden">
      <div className="relative h-full">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-12 pb-12 pt-44 md:pt-56">
            <Loader2 className="h-10 w-10 text-white/40 animate-spin" />
            <p className="text-[12px] font-bold uppercase tracking-[0.3em] text-white/60">Loading Viewer Data...</p>
          </div>
        ) : isReady && sceneMatched && viewer?.resultUrl ? (
          <GaussianSplatViewer
            key={viewer.jobId}
            ref={viewerHandleRef}
            url={viewer.resultUrl}
            showControlsHint={false}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-12 pb-12 pt-44 md:pt-56">
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
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 p-4 md:p-6 space-y-3">
        <div className="pointer-events-auto flex flex-col gap-4 rounded-md bg-black/45 border border-white/20 px-4 py-3 backdrop-blur-sm md:flex-row md:items-center md:justify-between">
          <Link
            to={`/uploads/${encodeURIComponent(sceneIdText)}`}
            className="group flex items-center gap-2 text-white/80 hover:text-white transition-colors font-bold text-[11px] uppercase tracking-widest"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Return to Scene
          </Link>

          <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em]">
            <span className="px-2 py-1 bg-white/10 border border-white/20">Scene {sceneIdText}</span>
            <span className="px-2 py-1 bg-white/10 border border-white/20">Job {jobIdText}</span>
            <span className="px-2 py-1 bg-[#D95F39]/20 border border-[#D95F39]/40 text-[#FFB8A4]">
              {statusLabel(currentStatus)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {canManageThumbnail && (
              <Button
                type="button"
                size="sm"
                onClick={() => void handleSaveThumbnail()}
                disabled={thumbnailSaving}
                className="h-9 rounded-md border border-[#8FD7B5]/35 bg-[#1A3C34]/55 px-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#D6FFE7] hover:bg-[#1A3C34]/75 hover:text-white disabled:border-white/15 disabled:bg-white/10 disabled:text-white/35"
              >
                <Camera size={14} />
                {thumbnailSaving ? "썸네일 저장 중..." : "현재 화면 저장"}
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              onClick={handleOpenPublish}
              disabled={!canPublish || posting || republishChecking}
              className="h-9 rounded-md border border-[#D95F39]/45 bg-[#D95F39]/20 px-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#FFE1D8] hover:bg-[#D95F39]/30 hover:text-white disabled:border-white/15 disabled:bg-white/10 disabled:text-white/35"
            >
              {republishChecking ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />}
              {republishChecking ? "게시 가능 여부 확인 중..." : "게시하기"}
            </Button>
            <button
              onClick={() => void fetchViewer()}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/20 bg-white/10 text-[#FFE1D8] hover:border-[#D95F39]/45 hover:bg-[#D95F39]/20 hover:text-white transition-colors"
              aria-label="viewer refresh"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        <div className="pointer-events-auto ml-auto flex max-w-full flex-wrap items-center justify-end gap-2">
          <div className="rounded-md border border-white/15 bg-black/35 px-3 py-2 text-[10px] font-medium leading-relaxed tracking-wide text-white/68">
            좌클릭 드래그: 회전 / 우클릭+드래그: 이동 / 휠: 줌 / Q,E: 화면 기울기
          </div>
          {viewer?.file && (
            <div className="rounded-md border border-white/15 bg-black/35 px-3 py-2 text-[10px] font-medium tracking-wide text-white/60">
              Size {fileContentLength !== null ? fileContentLength.toLocaleString() : "-"} bytes | Range{" "}
              {fileAcceptRanges === null ? "-" : fileAcceptRanges ? "enabled" : "disabled"}
            </div>
          )}
        </div>

        {postFeedback && (
          <div
            className={`pointer-events-auto px-4 py-3 flex items-center gap-3 text-xs font-bold uppercase tracking-widest rounded-md ${
              postFeedback.type === "success"
                ? "bg-[#1A3C34]/80 border border-[#8FD7B5]/35 text-[#D6FFE7]"
                : "bg-[#D95F39]/15 border border-[#D95F39]/40 text-[#FFB8A4]"
            }`}
          >
            <AlertCircle size={18} /> {postFeedback.text}
          </div>
        )}

        {republishAvailable && !postFeedback && (
          <div className="pointer-events-auto px-4 py-3 flex items-center gap-3 text-xs font-bold uppercase tracking-widest rounded-md bg-[#1A3C34]/80 border border-[#8FD7B5]/35 text-[#D6FFE7]">
            <AlertCircle size={18} /> 삭제된 게시물 이력이 감지되어 동일 Job을 다시 게시할 수 있습니다.
          </div>
        )}

        {thumbnailFeedback && (
          <div
            className={`pointer-events-auto px-4 py-3 flex items-center gap-3 text-xs font-bold uppercase tracking-widest rounded-md ${
              thumbnailFeedback.type === "success"
                ? "bg-[#1A3C34]/80 border border-[#8FD7B5]/35 text-[#D6FFE7]"
                : "bg-[#D95F39]/15 border border-[#D95F39]/40 text-[#FFB8A4]"
            }`}
          >
            <AlertCircle size={18} /> {thumbnailFeedback.text}
          </div>
        )}

        {err && (
          <div className="pointer-events-auto bg-[#D95F39]/15 border border-[#D95F39]/40 px-4 py-3 flex items-center gap-3 text-[#FFB8A4] text-xs font-bold uppercase tracking-widest rounded-md">
            <AlertCircle size={18} /> {err}
          </div>
        )}
      </div>

      {isPublishOpen && (
        <div className="absolute inset-0 z-[10000] flex items-center justify-center bg-black/55 p-4">
          <div
            ref={publishDialogRef}
            className="pointer-events-auto w-full max-w-md rounded-2xl border border-white/15 bg-[#11161C]/95 p-6 shadow-2xl backdrop-blur-md"
            onKeyDownCapture={(event) => stopEventPropagation(event.nativeEvent)}
            onKeyUpCapture={(event) => stopEventPropagation(event.nativeEvent)}
            onKeyPressCapture={(event) => stopEventPropagation(event.nativeEvent)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="text-[10px] font-black uppercase tracking-[0.24em] text-[#FFB8A4]">Publish</div>
                <h2 className="text-2xl font-serif italic text-white">게시물 등록</h2>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
                    Scene {sceneIdText}
                  </span>
                  <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
                    Job {jobIdText}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClosePublish}
                disabled={posting}
                className="inline-flex h-10 items-center justify-center rounded-md border border-white/15 bg-white px-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#11161C] hover:bg-[#F3F4F6] disabled:opacity-40"
              >
                닫기
              </button>
            </div>

            <div className="mt-6 space-y-3">
              <label htmlFor="post-title" className="block text-[10px] font-black uppercase tracking-[0.18em] text-white/55">
                게시글 제목
              </label>
              <Input
                id="post-title"
                value={publishTitle}
                maxLength={100}
                autoFocus
                disabled={posting}
                placeholder="제목을 입력하세요"
                onChange={(event) => {
                  setPublishTitle(event.target.value);
                  if (publishError && event.target.value.trim()) {
                    setPublishError("");
                  }
                }}
                onKeyDown={(event) => {
                  if (event.nativeEvent.isComposing) return;
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleCreatePost();
                  }
                }}
                className="h-12 border-white/15 bg-white/5 text-white placeholder:text-white/25 focus-visible:ring-[#D95F39]"
              />
              <div className="flex items-center justify-between text-[11px]">
                <span className={publishError ? "text-[#FFB8A4]" : "text-white/45"}>
                  {publishError || "\u00A0"}
                </span>
                <span className="text-white/45">{publishTitle.length}/100</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <Button
                type="button"
                onClick={handleClosePublish}
                disabled={posting}
                className="border border-white/15 bg-white px-4 text-[#11161C] hover:bg-[#F3F4F6]"
              >
                취소
              </Button>
              <Button
                type="button"
                onClick={() => void handleCreatePost()}
                disabled={!canSubmitPost}
                className="bg-[#D95F39] text-white hover:bg-[#E37252]"
              >
                {posting ? "게시 중..." : "게시"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(viewerContent, document.body);
}
