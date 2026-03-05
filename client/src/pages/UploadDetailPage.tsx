import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { createSceneJob, getJobViewer, getSceneJobProgress, getSceneJobs } from "../api/videos";
import type { JobProgressMetrics, JobStatus, JobViewerResponse, SceneJob } from "../api/types";
import Layout from "../components/Layout";
import { Separator } from "../components/ui/separator";
import PlyCanvasViewer from "../components/PlyCanvasViewer";
import {
  ArrowLeft, CheckCircle2, AlertCircle,
  HardDrive, RefreshCw, Loader2, Sparkles
} from "lucide-react";

type JobProgressView = {
  jobId: number;
  status: JobStatus;
  stage: string;
  progress: number;
  detail: string;
  updatedAt: string | null;
  metrics: JobProgressMetrics | null;
};

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

function mapJobFetchError(error: unknown) {
  const message = String(error instanceof Error ? error.message : error);
  if (message.includes("HTTP 401")) return "로그인이 필요합니다.";
  if (message.includes("HTTP 403")) return "해당 Scene에 접근 권한이 없습니다.";
  if (message.includes("SCENE_NOT_FOUND")) return "Scene을 찾을 수 없습니다.";
  return "Job 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

function mapViewerFetchError(error: unknown) {
  const message = String(error instanceof Error ? error.message : error);
  if (message.includes("HTTP 401")) return "로그인이 필요합니다.";
  if (message.includes("HTTP 403")) return "해당 Job에 접근 권한이 없습니다.";
  if (message.includes("JOB_NOT_FOUND")) return "Job을 찾을 수 없습니다.";
  return "Viewer 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

function mapCreateJobError(error: unknown) {
  const message = String(error instanceof Error ? error.message : error);
  if (message.includes("HTTP 401")) return "로그인이 필요합니다.";
  if (message.includes("HTTP 403")) return "해당 Scene에 접근 권한이 없습니다.";
  if (message.includes("BAD_REQUEST")) return "Job 파라미터가 올바르지 않습니다.";
  return "Job 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.";
}

function normalizeProgress(value: number | undefined) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, Number(value)));
}

export default function UploadDetailPage() {
  const nav = useNavigate();
  const { id } = useParams();
  const sceneId = String(id ?? "");

  const [jobs, setJobs] = useState<SceneJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [viewer, setViewer] = useState<JobViewerResponse | null>(null);
  const [jobProgress, setJobProgress] = useState<JobProgressView | null>(null);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [creatingJob, setCreatingJob] = useState(false);
  const [err, setErr] = useState("");
  const [imageCount, setImageCount] = useState(50);
  const [overlap, setOverlap] = useState(10);
  const [iteration, setIteration] = useState(30000);

  const fetchJobs = useCallback(async (preferredJobId?: number | null) => {
    const response = await getSceneJobs(sceneId, { limit: 20, pipeline: "3dgs" });
    const nextJobs = Array.isArray(response.jobs) ? response.jobs : [];
    setJobs(nextJobs);
    setSelectedJobId((current) => {
      const target = preferredJobId ?? current;
      if (target != null && nextJobs.some((job) => job.id === target)) {
        return target;
      }
      return nextJobs.length > 0 ? nextJobs[0].id : null;
    });
  }, [sceneId]);

  const fetchViewer = useCallback(async (jobId: number) => {
    setViewerLoading(true);
    try {
      const response = await getJobViewer(jobId);
      setViewer(response);
    } finally {
      setViewerLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!sceneId) {
      setErr("유효하지 않은 Scene ID입니다.");
      setJobsLoading(false);
      return;
    }

    let mounted = true;
    setJobsLoading(true);
    void (async () => {
      try {
        await fetchJobs();
        if (!mounted) return;
        setErr("");
      } catch (caught) {
        if (!mounted) return;
        const message = mapJobFetchError(caught);
        setErr(message);
        if (message.includes("로그인이 필요합니다.") || message.includes("접근 권한이 없습니다.")) {
          nav("/login");
        }
      } finally {
        if (mounted) setJobsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [fetchJobs, sceneId, nav]);

  useEffect(() => {
    if (selectedJobId == null) {
      setViewer(null);
      setJobProgress(null);
      return;
    }

    // Job 전환 시 이전 job의 진행 상태/뷰어가 남지 않도록 즉시 초기화
    setViewer(null);
    setJobProgress(null);

    let mounted = true;
    void (async () => {
      try {
        await fetchViewer(selectedJobId);
        if (!mounted) return;
        setErr("");
      } catch (caught) {
        if (!mounted) return;
        const message = mapViewerFetchError(caught);
        setErr(message);
        if (message.includes("로그인이 필요합니다.") || message.includes("접근 권한이 없습니다.")) {
          nav("/login");
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [selectedJobId, fetchViewer, nav]);

  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === selectedJobId) ?? null,
    [jobs, selectedJobId]
  );

  const currentProgress = useMemo(() => {
    if (!jobProgress || selectedJobId == null) return null;
    if (jobProgress.jobId !== selectedJobId) return null;
    return jobProgress;
  }, [jobProgress, selectedJobId]);

  const currentStatus = useMemo(() => {
    if (currentProgress) return currentProgress.status;
    if (viewer) return normalizeJobStatus(viewer.status);
    if (selectedJob) return normalizeJobStatus(selectedJob.status);
    return "queued";
  }, [currentProgress, viewer, selectedJob]);

  const syncJobProgress = useCallback(
    async (jobId: number, isCanceled?: () => boolean) => {
      const progress = await getSceneJobProgress(sceneId, jobId);
      if (isCanceled?.()) return;

      const normalizedStatus = normalizeJobStatus(progress.status);
      const normalizedProgress = normalizeProgress(progress.progress);
      const nextProgress: JobProgressView = {
        jobId,
        status: normalizedStatus,
        stage: progress.stage ?? "",
        progress: normalizedProgress,
        detail: progress.detail ?? "",
        updatedAt: progress.updatedAt ?? null,
        metrics: progress.metrics ?? null,
      };

      setJobProgress(nextProgress);
      setJobs((prev) =>
        prev.map((job) => (job.id === jobId ? { ...job, status: normalizedStatus } : job))
      );

      if (normalizedStatus === "ready" || normalizedStatus === "failed" || normalizedStatus === "canceled") {
        await fetchViewer(jobId);
        if (isCanceled?.()) return;
        await fetchJobs(jobId);
      }
    },
    [sceneId, fetchViewer, fetchJobs]
  );

  useEffect(() => {
    if (selectedJobId == null) return undefined;

    let canceled = false;
    void (async () => {
      try {
        await syncJobProgress(selectedJobId, () => canceled);
      } catch {
        if (canceled) return;
      }
    })();

    return () => {
      canceled = true;
    };
  }, [selectedJobId, syncJobProgress]);

  useEffect(() => {
    if (selectedJobId == null) return undefined;
    if (currentStatus !== "queued" && currentStatus !== "processing") return undefined;

    let canceled = false;
    const timer = window.setInterval(() => {
      void (async () => {
        try {
          await syncJobProgress(selectedJobId, () => canceled);
        } catch {
          if (canceled) return;
        }
      })();
    }, 4000);

    return () => {
      canceled = true;
      window.clearInterval(timer);
    };
  }, [selectedJobId, currentStatus, syncJobProgress]);

  const handleCreateJob = async () => {
    if (!sceneId) return;
    setCreatingJob(true);
    setErr("");
    try {
      const created = await createSceneJob(sceneId, {
        pipeline: "3dgs",
        imageCount: Math.max(1, Math.round(imageCount)),
        overlap: Math.max(0, Math.round(overlap)),
        iteration: Math.max(1, Math.round(iteration)),
      });

      const newJobId = Number(created.jobId);
      await fetchJobs(Number.isFinite(newJobId) ? newJobId : undefined);
      if (Number.isFinite(newJobId)) {
        setSelectedJobId(newJobId);
      }
    } catch (caught) {
      const message = mapCreateJobError(caught);
      setErr(message);
      if (message.includes("로그인이 필요합니다.") || message.includes("접근 권한이 없습니다.")) {
        nav("/login");
      }
    } finally {
      setCreatingJob(false);
    }
  };

  const isReady = currentStatus === "ready";
  const isProcessing = currentStatus === "processing" || currentStatus === "queued";
  const progressValue = currentProgress ? normalizeProgress(currentProgress.progress) : 0;
  const progressPercent = `${(progressValue * 100).toFixed(0)}%`;
  const progressFixed = progressValue.toFixed(2);
  const isProgressStale = useMemo(() => {
    if (!currentProgress?.updatedAt) return false;
    const updatedAtMs = Date.parse(currentProgress.updatedAt);
    if (!Number.isFinite(updatedAtMs)) return false;
    const isRunning = currentProgress.status === "queued" || currentProgress.status === "processing";
    return isRunning && Date.now() - updatedAtMs > 10 * 60 * 1000;
  }, [currentProgress]);

  if (jobsLoading) {
    return (
      <Layout>
        <div className="bg-[#F2F0EB] min-h-screen pt-28 flex items-center justify-center">
          <div className="flex flex-col items-center gap-6">
            <Loader2 className="h-10 w-10 animate-spin text-[#1A3C34]" />
            <p className="text-[11px] font-bold text-[#1A3C34]/30 uppercase tracking-[0.4em]">
              Loading Scene Jobs
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-[#F2F0EB] min-h-screen pt-28 pb-20 px-6 relative text-[#2D2D2D]">
        <div className="max-w-6xl mx-auto space-y-12 relative z-10">

          <div className="flex items-center justify-between">
            <Link
              to="/uploads"
              className="group flex items-center gap-3 text-[#1A3C34]/40 hover:text-[#1A3C34] transition-colors font-bold text-[11px] uppercase tracking-widest"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Return to Archives
            </Link>

            <button
              onClick={() => window.location.reload()}
              className="text-[#1A3C34]/40 hover:text-[#D95F39] transition-colors"
            >
              <RefreshCw size={18} />
            </button>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-[#1A3C34]/10 pb-12">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 text-[#D95F39] text-[11px] font-black uppercase tracking-[0.3em]">
                <Sparkles size={14} /> Scene Viewer
              </div>
              <h1 className="text-5xl md:text-7xl font-serif italic tracking-tight">
                Scene <span className="font-sans not-italic font-black text-[#1A3C34] uppercase">Preview</span>
              </h1>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold bg-[#1A3C34] text-[#F2F0EB] px-3 py-1 uppercase tracking-tighter">
                  Scene ID: {sceneId}
                </span>
                {selectedJobId != null && (
                  <span className="text-[10px] font-bold text-[#1A3C34]/40 uppercase tracking-widest border-l border-[#1A3C34]/20 pl-3">
                    Job {selectedJobId}
                  </span>
                )}
              </div>
            </div>
          </div>

          {err && (
            <div className="bg-[#D95F39]/10 border border-[#D95F39]/20 p-6 flex items-center gap-4 text-[#D95F39] text-xs font-black uppercase tracking-widest">
              <AlertCircle size={20} /> {err}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8 space-y-10">
              <div className="bg-white border border-[#1A3C34]/10 p-10 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-[#1A3C34]/30">
                    Synthesis Pipeline
                  </h3>
                  <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1A3C34]/50">
                    Progress {progressFixed}
                  </div>
                </div>
                <div className="h-2 bg-[#1A3C34]/10">
                  <div className="h-2 bg-[#D95F39] transition-all duration-500" style={{ width: progressPercent }} />
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-black uppercase tracking-[0.14em] text-[#1A3C34]/70">
                    Stage: {currentProgress?.stage || "PENDING"}
                  </span>
                  <span className="text-[#1A3C34]/45 font-bold">
                    {currentProgress?.updatedAt ? new Date(currentProgress.updatedAt).toLocaleString("ko-KR") : "-"}
                  </span>
                </div>
                {currentProgress?.detail && (
                  <div className="text-[12px] text-[#1A3C34]/65 font-medium">
                    {currentProgress.detail}
                  </div>
                )}
                {isProgressStale && (
                  <div className="text-[11px] font-bold text-[#D95F39] uppercase tracking-[0.16em]">
                    Progress 업데이트가 지연되고 있습니다.
                  </div>
                )}
              </div>

              <div className="relative aspect-video bg-white border border-[#1A3C34]/10 overflow-hidden">
                {viewerLoading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center p-12">
                    <Loader2 className="h-10 w-10 text-[#1A3C34]/20 animate-spin" />
                    <p className="text-[12px] font-bold uppercase tracking-[0.3em] text-[#1A3C34]/30">
                      Loading Viewer Data...
                    </p>
                  </div>
                ) : isReady && viewer?.resultUrl ? (
                  <PlyCanvasViewer key={viewer.jobId} url={viewer.resultUrl} />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12">
                    <div className="mx-auto h-20 w-20 bg-[#F2F0EB] flex items-center justify-center text-[#1A3C34] border border-[#1A3C34]/10">
                      <HardDrive size={34} className={isProcessing ? "animate-pulse" : ""} />
                    </div>
                    <h3 className="mt-6 text-3xl font-serif italic text-[#1A3C34]">
                      {statusLabel(currentStatus)}
                    </h3>
                    <p className="mt-2 text-[#1A3C34]/50 text-[13px] font-medium max-w-xs mx-auto leading-relaxed">
                      {currentStatus === "processing" || currentStatus === "queued"
                        ? "선택한 Job의 결과를 생성 중입니다."
                        : currentStatus === "failed"
                        ? "Job 처리에 실패했습니다. 파라미터를 조정해 다시 생성해 주세요."
                        : currentStatus === "canceled"
                        ? "해당 Job은 취소되었습니다."
                        : "뷰어에 표시할 결과 파일이 없습니다."}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-4 space-y-8">
              <div className="bg-white border border-[#1A3C34]/10 p-10 space-y-10">
                <h4 className="text-[12px] font-black uppercase tracking-[0.4em] text-[#1A3C34]">Create Job</h4>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="image-count" className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1A3C34]/60">
                        Image Count
                      </label>
                      <span className="text-[11px] font-black text-[#1A3C34]">{imageCount}</span>
                    </div>
                    <input
                      id="image-count"
                      type="range"
                      min={1}
                      max={500}
                      value={imageCount}
                      disabled={creatingJob}
                      onChange={(event) => setImageCount(Number(event.target.value))}
                      className="w-full accent-[#D95F39]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="overlap" className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#1A3C34]/60">
                        Overlap
                      </label>
                      <input
                        id="overlap"
                        type="number"
                        min={0}
                        step={1}
                        value={overlap}
                        disabled={creatingJob}
                        onChange={(event) => setOverlap(Number(event.target.value))}
                        className="w-full h-11 px-3 bg-[#F2F0EB] border border-[#1A3C34]/20 text-[13px] font-medium text-[#1A3C34] focus:outline-none focus:border-[#D95F39]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="iteration" className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#1A3C34]/60">
                        Iteration
                      </label>
                      <input
                        id="iteration"
                        type="number"
                        min={1}
                        step={100}
                        value={iteration}
                        disabled={creatingJob}
                        onChange={(event) => setIteration(Number(event.target.value))}
                        className="w-full h-11 px-3 bg-[#F2F0EB] border border-[#1A3C34]/20 text-[13px] font-medium text-[#1A3C34] focus:outline-none focus:border-[#D95F39]"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCreateJob}
                    disabled={creatingJob}
                    className="w-full h-12 bg-[#1A3C34] text-[#F2F0EB] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-[#D95F39] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {creatingJob ? "Creating..." : "Create Batch Job"}
                  </button>
                </div>

                <Separator className="bg-[#1A3C34]/10" />

                <div className="space-y-3">
                  <h5 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#1A3C34]/60">Jobs</h5>
                  {jobs.length === 0 ? (
                    <div className="text-[11px] font-bold text-[#1A3C34]/35 uppercase tracking-[0.16em]">
                      생성된 Job이 없습니다.
                    </div>
                  ) : (
                    jobs.map((job) => {
                      const active = selectedJobId === job.id;
                      return (
                        <button
                          key={job.id}
                          type="button"
                          onClick={() => setSelectedJobId(job.id)}
                          className={`w-full text-left border px-4 py-3 transition-colors ${
                            active
                              ? "border-[#D95F39] bg-[#D95F39]/10"
                              : "border-[#1A3C34]/10 hover:border-[#1A3C34]/25 bg-white"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1A3C34]">
                              Job {job.id}
                            </span>
                            <StatusChip status={normalizeJobStatus(job.status)} />
                          </div>
                          <div className="mt-2 text-[10px] text-[#1A3C34]/45 font-bold uppercase tracking-[0.16em]">
                            {new Date(job.createdAt).toLocaleString("ko-KR")}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="bg-[#1A3C34] p-10 text-[#F2F0EB] space-y-6">
                <div className="flex items-center gap-3 text-[#D95F39]">
                  <CheckCircle2 size={18} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Viewer Status</span>
                </div>
                <p className="text-[13px] leading-relaxed opacity-70 font-medium">
                  Current status: <span className="text-[#F2F0EB] font-bold">{statusLabel(currentStatus)}</span>
                </p>
                {viewer?.file && (
                  <div className="text-[11px] opacity-70 font-medium space-y-1">
                    <div>Size: {viewer.file.contentLength.toLocaleString()} bytes</div>
                    <div>ETag: {viewer.file.etag}</div>
                    <div>Range: {viewer.file.acceptRanges ? "enabled" : "disabled"}</div>
                  </div>
                )}
                {currentProgress?.metrics && (
                  <div className="text-[11px] opacity-70 font-medium space-y-1">
                    <div>imgRequested: {currentProgress.metrics.imgRequested ?? "-"}</div>
                    <div>frameCount: {currentProgress.metrics.frameCount ?? "-"}</div>
                    <div>iters: {currentProgress.metrics.iter ?? 0}/{currentProgress.metrics.iters ?? "-"}</div>
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

function StatusChip({ status }: { status: JobStatus }) {
  const config: Record<JobStatus, { label: string; className: string }> = {
    queued: { label: "Queued", className: "bg-[#F2F0EB] text-[#1A3C34]/45" },
    processing: { label: "Processing", className: "border border-[#1A3C34] text-[#1A3C34] animate-pulse" },
    ready: { label: "Ready", className: "bg-[#1A3C34] text-[#F2F0EB]" },
    failed: { label: "Failed", className: "bg-[#D95F39] text-white" },
    canceled: { label: "Canceled", className: "border border-[#D95F39] text-[#D95F39]" },
  };
  const item = config[status] ?? config.queued;
  return <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] ${item.className}`}>{item.label}</span>;
}
