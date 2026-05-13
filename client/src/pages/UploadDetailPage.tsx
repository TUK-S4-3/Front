import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  activateSceneKeyframeSet,
  createSceneJob,
  createSceneKeyframeSet,
  getSceneJobProgress,
  getSceneJobs,
  getSceneKeyframeSets,
} from "../api/videos";
import type { JobProgressMetrics, JobStatus, SceneJob, SceneKeyframeSet } from "../api/types";
import Layout from "../components/Layout";
import { Separator } from "../components/ui/separator";
import {
  ArrowLeft, CheckCircle2, AlertCircle,
  Film, HardDrive, ImageIcon, RefreshCw, Loader2, Sparkles
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

function mapCreateJobError(error: unknown) {
  const message = String(error instanceof Error ? error.message : error);
  if (message.includes("HTTP 401")) return "로그인이 필요합니다.";
  if (message.includes("HTTP 403")) return "해당 Scene에 접근 권한이 없습니다.";
  if (message.includes("BAD_REQUEST")) return "Job 생성 요청이 올바르지 않습니다.";
  return "Job 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.";
}

function normalizeProgress(value: number | undefined) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, Number(value)));
}

function normalizePublicStorageBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, "");
}

function encodeStorageKeyBySegment(key: string) {
  return key.split("/").map((segment) => encodeURIComponent(segment)).join("/");
}

function buildPublicVideoUrl(baseUrl: string, inputVideoKey: string | null) {
  const normalizedBaseUrl = normalizePublicStorageBaseUrl(baseUrl.trim());
  if (!normalizedBaseUrl || !inputVideoKey) return "";
  return `${normalizedBaseUrl}/${encodeStorageKeyBySegment(inputVideoKey)}`;
}

function isViewerReadyJob(job: SceneJob | null | undefined) {
  if (!job) return false;
  if (typeof job.viewerReady === "boolean") {
    return job.viewerReady;
  }
  const normalized = normalizeJobStatus(job.status);
  if (normalized !== "ready") return false;
  if (typeof job.resultExists === "boolean") {
    return job.resultExists;
  }
  return Boolean(job.gaussianSplatKey);
}

function isPostableJob(job: SceneJob | null | undefined) {
  if (!job) return false;
  if (typeof job.postable === "boolean") {
    return job.postable;
  }
  return isViewerReadyJob(job) && !job.alreadyPosted;
}

function selectDefaultJobId(jobs: SceneJob[]) {
  const latestSuccessfulJob = jobs.find((job) => isViewerReadyJob(job) || normalizeJobStatus(job.status) === "ready");
  return latestSuccessfulJob?.id ?? jobs[0]?.id ?? null;
}

function formatDateLabel(value: string | null | undefined) {
  if (!value) return "-";
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return "-";
  return new Date(parsed).toLocaleString("ko-KR");
}

function formatAutoParameterValue(value: number | null | undefined) {
  if (!Number.isFinite(value) || Number(value) <= 0) return "자동";
  return Number(value).toLocaleString("ko-KR");
}

export default function UploadDetailPage() {
  const nav = useNavigate();
  const { sceneId } = useParams();
  const sceneIdText = String(sceneId ?? "");

  const [jobs, setJobs] = useState<SceneJob[]>([]);
  const [keyframeSets, setKeyframeSets] = useState<SceneKeyframeSet[]>([]);
  const [selectedKeyframeSetId, setSelectedKeyframeSetId] = useState<string | number | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [inputVideoKey, setInputVideoKey] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState<JobProgressView | null>(null);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [creatingJob, setCreatingJob] = useState(false);
  const [creatingKeyframeSet, setCreatingKeyframeSet] = useState(false);
  const [activatingKeyframeSet, setActivatingKeyframeSet] = useState(false);
  const [err, setErr] = useState("");

  const publicStorageBaseUrl = useMemo(() => {
    const env = import.meta.env as Record<string, string | undefined>;
    return String(
      env.VITE_PUBLIC_STORAGE_BASE_URL ??
        env.PUBLIC_STORAGE_BASE_URL ??
        env.VITE_PUBLIC_S3_BASE_URL ??
        env.PUBLIC_S3_BASE_URL ??
        "http://localhost:3000/local-assets"
    ).trim();
  }, []);

  const sourceVideoUrl = useMemo(
    () => buildPublicVideoUrl(publicStorageBaseUrl, inputVideoKey),
    [publicStorageBaseUrl, inputVideoKey]
  );

  const fetchJobs = useCallback(async (preferredJobId?: number | null) => {
    const response = await getSceneJobs(sceneIdText, { limit: 20 });
    const nextJobs = Array.isArray(response.jobs) ? response.jobs : [];
    const nextInputVideoKey =
      typeof response.inputVideoKey === "string" && response.inputVideoKey.trim()
        ? response.inputVideoKey
        : null;
    setInputVideoKey(nextInputVideoKey);
    setJobs(nextJobs);
    setSelectedJobId((current) => {
      const target = preferredJobId ?? current;
      if (target != null && nextJobs.some((job) => job.id === target)) {
        return target;
      }
      return selectDefaultJobId(nextJobs);
    });
  }, [sceneIdText]);

  const fetchKeyframeSets = useCallback(async (preferredKeyframeSetId?: string | number | null) => {
    const response = await getSceneKeyframeSets(sceneIdText);
    const nextKeyframeSets = Array.isArray(response.keyframeSets) ? response.keyframeSets : [];
    setKeyframeSets(nextKeyframeSets);
    setSelectedKeyframeSetId((current) => {
      const target = preferredKeyframeSetId ?? current;
      if (target != null && nextKeyframeSets.some((item) => String(item.id) === String(target))) {
        return target;
      }
      const active = nextKeyframeSets.find((item) => item.active);
      return active?.id ?? nextKeyframeSets[0]?.id ?? null;
    });
  }, [sceneIdText]);

  useEffect(() => {
    if (!sceneIdText) {
      setErr("유효하지 않은 Scene ID입니다.");
      setJobsLoading(false);
      return;
    }

    let mounted = true;
    setJobsLoading(true);
    void (async () => {
      try {
        await Promise.all([fetchJobs(), fetchKeyframeSets()]);
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
  }, [fetchJobs, fetchKeyframeSets, sceneIdText, nav]);

  useEffect(() => {
    if (selectedJobId == null) {
      setJobProgress(null);
      return;
    }

    // Job 전환 시 이전 job의 진행 상태가 남지 않도록 즉시 초기화
    setJobProgress(null);
  }, [selectedJobId]);

  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === selectedJobId) ?? null,
    [jobs, selectedJobId]
  );

  const selectedKeyframeSet = useMemo(
    () => keyframeSets.find((item) => String(item.id) === String(selectedKeyframeSetId)) ?? null,
    [keyframeSets, selectedKeyframeSetId]
  );
  const latestReadySfmJob = useMemo(
    () =>
      jobs.find(
        (job) =>
          job.pipeline === "sfm" &&
          normalizeJobStatus(job.status) === "ready" &&
          Boolean(job.sfmResultKey)
      ) ?? null,
    [jobs]
  );

  const currentProgress = useMemo(() => {
    if (!jobProgress || selectedJobId == null) return null;
    if (jobProgress.jobId !== selectedJobId) return null;
    return jobProgress;
  }, [jobProgress, selectedJobId]);

  const currentStatus = useMemo(() => {
    if (selectedJob && isViewerReadyJob(selectedJob)) return "ready";
    if (currentProgress) return currentProgress.status;
    if (selectedJob) return normalizeJobStatus(selectedJob.status);
    return "queued";
  }, [currentProgress, selectedJob]);

  const syncJobProgress = useCallback(
    async (jobId: number, isCanceled?: () => boolean) => {
      const progress = await getSceneJobProgress(sceneIdText, jobId);
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
        await Promise.all([fetchJobs(jobId), fetchKeyframeSets()]);
      }
    },
    [sceneIdText, fetchJobs, fetchKeyframeSets]
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

  const gsSourceJob = useMemo(() => {
    if (
      selectedJob?.pipeline === "sfm" &&
      normalizeJobStatus(selectedJob.status) === "ready" &&
      selectedJob.sfmResultKey
    ) {
      return selectedJob;
    }
    return latestReadySfmJob;
  }, [latestReadySfmJob, selectedJob]);

  const createPipelineJob = async (pipeline: "3dgs" | "sfm" | "gs", sourceJobId?: string | number | null) => {
    if (!sceneIdText) return;
    setCreatingJob(true);
    setErr("");
    try {
      const created = await createSceneJob(sceneIdText, {
        pipeline,
        keyframeSetId: pipeline === "gs" ? null : selectedKeyframeSetId,
        sourceJobId: sourceJobId ?? null,
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

  const handleCreateJob = () => createPipelineJob("sfm");
  const handleCreateGsJob = () => createPipelineJob("gs", gsSourceJob?.id ?? null);

  const handleCreateKeyframeSet = async () => {
    if (!sceneIdText) return;
    setCreatingKeyframeSet(true);
    setErr("");
    try {
      const created = await createSceneKeyframeSet(sceneIdText);
      await Promise.all([fetchKeyframeSets(created.keyframeSet.id), fetchJobs(Number(created.jobId))]);
      const newJobId = Number(created.jobId);
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
      setCreatingKeyframeSet(false);
    }
  };

  const handleActivateKeyframeSet = async () => {
    if (!sceneIdText || selectedKeyframeSetId == null) return;
    setActivatingKeyframeSet(true);
    setErr("");
    try {
      await activateSceneKeyframeSet(sceneIdText, selectedKeyframeSetId);
      await fetchKeyframeSets(selectedKeyframeSetId);
    } catch (caught) {
      const message = mapCreateJobError(caught);
      setErr(message);
    } finally {
      setActivatingKeyframeSet(false);
    }
  };

  const viewerPath = useMemo(() => {
    if (!sceneIdText || selectedJobId == null) return "";
    return `/uploads/${encodeURIComponent(sceneIdText)}/jobs/${encodeURIComponent(String(selectedJobId))}/viewer`;
  }, [sceneIdText, selectedJobId]);

  const selectedViewerReady = useMemo(() => isViewerReadyJob(selectedJob), [selectedJob]);
  const selectedPostable = useMemo(() => isPostableJob(selectedJob), [selectedJob]);
  const canOpenViewer = selectedJobId != null && selectedViewerReady;
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
                <Sparkles size={14} /> Scene Detail
              </div>
              <h1 className="text-5xl md:text-7xl font-serif italic tracking-tight">
                Scene <span className="font-sans not-italic font-black text-[#1A3C34] uppercase">Preview</span>
              </h1>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold bg-[#1A3C34] text-[#F2F0EB] px-3 py-1 uppercase tracking-tighter">
                  Scene ID: {sceneIdText}
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
              <div className="relative aspect-video bg-white border border-[#1A3C34]/10 overflow-hidden">
                {sourceVideoUrl ? (
                  <video
                    key={sourceVideoUrl}
                    src={sourceVideoUrl}
                    controls
                    preload="metadata"
                    className="h-full w-full object-contain bg-black"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12">
                    <div className="mx-auto h-20 w-20 bg-[#F2F0EB] flex items-center justify-center text-[#1A3C34] border border-[#1A3C34]/10">
                      <HardDrive size={34} />
                    </div>
                    <h3 className="mt-6 text-3xl font-serif italic text-[#1A3C34]">
                      Video Unavailable
                    </h3>
                    <p className="mt-2 text-[#1A3C34]/50 text-[13px] font-medium max-w-xs mx-auto leading-relaxed">
                      inputVideoKey 또는 PUBLIC_STORAGE_BASE_URL 설정을 확인해 주세요.
                    </p>
                  </div>
                )}
              </div>

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

              <div className="bg-white border border-[#1A3C34]/10 p-10 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-[#1A3C34]/30">
                    Selected Job Runtime
                  </h3>
                  <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1A3C34]/50">
                    Job {selectedJobId ?? "-"}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <ParameterCard label="Pipeline" value={selectedJob?.pipeline ?? "3dgs"} />
                  <ParameterCard
                    label="Image Set"
                    value={formatAutoParameterValue(currentProgress?.metrics?.frameCount ?? selectedJob?.imageCount)}
                  />
                  <ParameterCard label="Overlap" value={formatAutoParameterValue(selectedJob?.overlap)} />
                  <ParameterCard
                    label="Iteration"
                    value={formatAutoParameterValue(currentProgress?.metrics?.itersRequested ?? selectedJob?.iteration)}
                  />
                </div>

                <p className="text-[12px] font-medium text-[#1A3C34]/55">
                  이미지셋과 Overlap은 Keyframe Selection 결과 기준으로 자동 산출됩니다.
                </p>
              </div>

            </div>

            <div className="lg:col-span-4 space-y-8">
              <div className="bg-white border border-[#1A3C34]/10 p-10 space-y-10">
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-[12px] font-black uppercase tracking-[0.4em] text-[#1A3C34]">
                      Keyframes
                    </h4>
                    <button
                      type="button"
                      onClick={handleCreateKeyframeSet}
                      disabled={creatingKeyframeSet}
                      className="h-9 px-3 bg-[#1A3C34] text-[#F2F0EB] text-[9px] font-black uppercase tracking-[0.14em] hover:bg-[#D95F39] transition-colors disabled:opacity-60"
                    >
                      {creatingKeyframeSet ? "Running" : "Rerun KS"}
                    </button>
                  </div>

                  {keyframeSets.length === 0 ? (
                    <div className="border border-[#1A3C34]/10 bg-[#F2F0EB] p-4 text-[11px] font-bold text-[#1A3C34]/45 uppercase tracking-[0.14em]">
                      아직 생성된 KS 버전이 없습니다. Job 생성 시 자동 생성됩니다.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {keyframeSets.map((item) => {
                        const active = String(item.id) === String(selectedKeyframeSetId);
                        return (
                          <button
                            key={String(item.id)}
                            type="button"
                            onClick={() => setSelectedKeyframeSetId(item.id)}
                            className={`w-full text-left border px-4 py-3 transition-colors ${
                              active
                                ? "border-[#D95F39] bg-[#D95F39]/10"
                                : "border-[#1A3C34]/10 hover:border-[#1A3C34]/25 bg-white"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1A3C34]">
                                KS v{item.version}
                              </span>
                              <span className="text-[9px] font-black uppercase tracking-[0.14em] text-[#1A3C34]/55">
                                {item.active ? "Active" : item.status}
                              </span>
                            </div>
                            <div className="mt-2 text-[10px] text-[#1A3C34]/45 font-bold uppercase tracking-[0.12em]">
                              Frames {item.selectedFrameCount ?? 0} · {formatDateLabel(item.createdAt)}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {selectedKeyframeSet && (
                    <div className="space-y-4 border border-[#1A3C34]/10 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1A3C34]/55">
                          Selected KS v{selectedKeyframeSet.version}
                        </div>
                        <button
                          type="button"
                          onClick={handleActivateKeyframeSet}
                          disabled={activatingKeyframeSet || selectedKeyframeSet.active || selectedKeyframeSet.status !== "ready"}
                          className="h-8 px-3 border border-[#1A3C34]/30 text-[9px] font-black uppercase tracking-[0.12em] text-[#1A3C34] disabled:opacity-40"
                        >
                          {selectedKeyframeSet.active ? "Active" : "Set Active"}
                        </button>
                      </div>

                      {selectedKeyframeSet.frameIndexPlotUrl ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#1A3C34]/50">
                            <ImageIcon size={13} /> Frame Index
                          </div>
                          <img
                            src={selectedKeyframeSet.frameIndexPlotUrl}
                            alt={`KS v${selectedKeyframeSet.version} frame index comparison`}
                            className="w-full border border-[#1A3C34]/10 bg-[#F2F0EB]"
                          />
                        </div>
                      ) : null}

                      {selectedKeyframeSet.timelineComparisonUrl ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#1A3C34]/50">
                            <Film size={13} /> Timeline
                          </div>
                          <video
                            src={selectedKeyframeSet.timelineComparisonUrl}
                            controls
                            preload="metadata"
                            className="w-full border border-[#1A3C34]/10 bg-black"
                          />
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>

                <Separator className="bg-[#1A3C34]/10" />

                <h4 className="text-[12px] font-black uppercase tracking-[0.4em] text-[#1A3C34]">Create Job</h4>

                <div className="space-y-5">
                  <button
                    type="button"
                    onClick={handleCreateJob}
                    disabled={creatingJob}
                    className="w-full h-12 bg-[#1A3C34] text-[#F2F0EB] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-[#D95F39] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {creatingJob ? "Creating..." : "Create SfM Job"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateGsJob}
                    disabled={creatingJob || !gsSourceJob}
                    className="w-full h-12 border border-[#1A3C34] text-[#1A3C34] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-[#1A3C34] hover:text-[#F2F0EB] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {gsSourceJob ? `Create GS from Job ${gsSourceJob.id}` : "GS Needs Ready SfM"}
                  </button>
                  <div className="text-[11px] font-medium text-[#1A3C34]/50 leading-relaxed">
                    선택된 KS 버전{selectedKeyframeSet ? ` v${selectedKeyframeSet.version}` : ""}으로 SfM을 먼저 생성하고, READY 상태의 SfM job으로 GS를 실행합니다.
                  </div>
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
                          <div className="mt-3 flex flex-wrap gap-2">
                            {job.pipeline && (
                              <span className="px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] bg-[#F2F0EB] text-[#1A3C34]/55">
                                {job.pipeline}
                              </span>
                            )}
                            {isViewerReadyJob(job) && (
                              <span className="px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] bg-[#1A3C34] text-[#F2F0EB]">
                                Viewer Ready
                              </span>
                            )}
                            {isPostableJob(job) && (
                              <span className="px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] bg-[#D95F39] text-white">
                                Postable
                              </span>
                            )}
                            {job.alreadyPosted && (
                              <span className="px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] border border-[#D95F39] text-[#D95F39]">
                                Posted
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!canOpenViewer) return;
                    nav(viewerPath);
                  }}
                  disabled={!canOpenViewer}
                  className="w-full h-12 border border-[#1A3C34] text-[#1A3C34] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-[#1A3C34] hover:text-[#F2F0EB] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#1A3C34]"
                >
                  {canOpenViewer ? "Open 3D Viewer" : "Viewer Available When Viewer Ready"}
                </button>
              </div>

              <div className="bg-[#1A3C34] p-10 text-[#F2F0EB] space-y-6">
                <div className="flex items-center gap-3 text-[#D95F39]">
                  <CheckCircle2 size={18} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Job Snapshot</span>
                </div>
                <p className="text-[13px] leading-relaxed opacity-70 font-medium">
                  Current status: <span className="text-[#F2F0EB] font-bold">{statusLabel(currentStatus)}</span>
                </p>
                <div className="text-[11px] opacity-70 font-medium space-y-1">
                  <div>Job ID: {selectedJobId ?? "-"}</div>
                  <div>Pipeline: {selectedJob?.pipeline ?? "3dgs"}</div>
                  <div>Viewer Ready: {selectedViewerReady ? "yes" : "no"}</div>
                  <div>Postable: {selectedPostable ? "yes" : "no"}</div>
                  <div>Already Posted: {selectedJob?.alreadyPosted ? "yes" : "no"}</div>
                  <div>Result Exists: {selectedJob ? (selectedJob.resultExists ? "yes" : "no") : "-"}</div>
                  <div>Created At: {formatDateLabel(selectedJob?.createdAt)}</div>
                  <div>Ended At: {formatDateLabel(selectedJob?.endedAt ?? selectedJob?.finishedAt)}</div>
                </div>
                <div className="text-[11px] opacity-70 font-medium space-y-1">
                  <div>Image Set: {formatAutoParameterValue(currentProgress?.metrics?.frameCount ?? selectedJob?.imageCount)}</div>
                  <div>Overlap: {formatAutoParameterValue(selectedJob?.overlap)}</div>
                  <div>Iteration: {formatAutoParameterValue(currentProgress?.metrics?.itersRequested ?? selectedJob?.iteration)}</div>
                </div>
                {currentProgress?.metrics && (
                  <div className="text-[11px] opacity-70 font-medium space-y-1">
                    <div>imgRequested: {currentProgress.metrics.imgRequested ?? "-"}</div>
                    <div>frameCount: {currentProgress.metrics.frameCount ?? "-"}</div>
                    <div>iters: {currentProgress.metrics.iter ?? 0}/{currentProgress.metrics.iters ?? "-"}</div>
                  </div>
                )}
                <p className="text-[11px] opacity-60 font-medium leading-relaxed">
                  게시 기준은 선택된 job의 <span className="font-bold text-[#F2F0EB]">postable</span> 값입니다.
                  viewer 진입 기준은 <span className="font-bold text-[#F2F0EB]">viewerReady</span> 값을 우선 사용합니다.
                </p>
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

function ParameterCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#1A3C34]/10 bg-[#F2F0EB]/35 p-4">
      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1A3C34]/40">{label}</div>
      <div className="mt-2 text-2xl font-black tracking-tight text-[#1A3C34]">{value}</div>
    </div>
  );
}
