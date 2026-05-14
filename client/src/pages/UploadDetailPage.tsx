import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  activateSceneKeyframeSet,
  createSceneJob,
  getSceneJobProgress,
  getSceneJobs,
  getSceneKeyframeSets,
  runSceneJobGs,
} from "../api/videos";
import type { JobProgressMetrics, JobStatus, SceneJob, SceneKeyframeSet } from "../api/types";
import Layout from "../components/Layout";
import { Separator } from "../components/ui/separator";
import {
  ArrowLeft, AlertCircle,
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

type PipelineTab = "ks" | "sfm" | "gs";
type PipelineStepState = "waiting" | "active" | "done" | "failed";
type PrimaryPipelineAction = "create" | "run-gs" | "viewer" | "none";

type PrimaryPipelineCta = {
  action: PrimaryPipelineAction;
  label: string;
  description: string;
  disabled: boolean;
  className: string;
};

function normalizeJobStatus(status: string | null | undefined): JobStatus {
  const normalized = String(status ?? "").trim().toLowerCase();
  if (normalized === "ready" || normalized === "succeeded" || normalized === "success" || normalized === "done") {
    return "ready";
  }
  if (normalized === "processing" || normalized === "running") {
    return "processing";
  }
  if (normalized === "waiting_gs" || normalized === "waiting-gs" || normalized === "sfm_done" || normalized === "sfm-done") {
    return "waiting_gs";
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
  if (status === "waiting_gs") return "Waiting GS";
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
  if (message.includes("JOB_ALREADY_RUNNING")) return "이미 실행 중인 Job입니다.";
  if (message.includes("SFM_RESULT_REQUIRED")) return "GS 실행에는 먼저 완료된 SfM 결과가 필요합니다.";
  if (message.includes("GS_ALREADY_READY")) return "이미 GS 결과가 준비된 Job입니다.";
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
  const [activatingKeyframeSet, setActivatingKeyframeSet] = useState(false);
  const [activePipelineTab, setActivePipelineTab] = useState<PipelineTab>("ks");
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
    const response = await getSceneJobs(sceneIdText, { limit: 20, pipeline: "3dgs" });
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
  const selectedKeyframeSetIsReady = String(selectedKeyframeSet?.status ?? "").toLowerCase() === "ready";
  const selectedJobKeyframeSet = selectedJob?.keyframeSet ?? selectedKeyframeSet;
  const canRunSelectedGs = useMemo(() => {
    if (!selectedJob) return false;
    return (
      selectedJob.canRunGs === true ||
      (normalizeJobStatus(selectedJob.status) === "waiting_gs" && Boolean(selectedJob.sfmResultKey))
    );
  }, [selectedJob]);

  const currentProgress = useMemo(() => {
    if (!jobProgress || selectedJobId == null) return null;
    if (jobProgress.jobId !== selectedJobId) return null;
    return jobProgress;
  }, [jobProgress, selectedJobId]);

  const currentStatus = useMemo(() => {
    if (selectedJob && normalizeJobStatus(selectedJob.status) === "waiting_gs") return "waiting_gs";
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

      if (
        normalizedStatus === "waiting_gs" ||
        normalizedStatus === "ready" ||
        normalizedStatus === "failed" ||
        normalizedStatus === "canceled"
      ) {
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

  const createPipelineJob = async () => {
    if (!sceneIdText) return;
    setCreatingJob(true);
    setErr("");
    try {
      const created = await createSceneJob(sceneIdText, {
        pipeline: "3dgs",
        keyframeSetId: selectedKeyframeSetIsReady ? selectedKeyframeSetId : null,
      });

      const newJobId = Number(created.jobId);
      await Promise.all([
        fetchJobs(Number.isFinite(newJobId) ? newJobId : undefined),
        fetchKeyframeSets(created.keyframeSet?.id ?? null),
      ]);
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

  const handleCreateJob = () => createPipelineJob();
  const handleRunGs = async () => {
    if (!sceneIdText || selectedJobId == null || !canRunSelectedGs) return;
    setCreatingJob(true);
    setErr("");
    try {
      await runSceneJobGs(sceneIdText, selectedJobId);
      await fetchJobs(selectedJobId);
      await syncJobProgress(selectedJobId);
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
  const sfmViewerPath = useMemo(() => {
    return viewerPath ? `${viewerPath}?view=sfm` : "";
  }, [viewerPath]);

  const selectedViewerReady = useMemo(() => isViewerReadyJob(selectedJob), [selectedJob]);
  const selectedPostable = useMemo(() => isPostableJob(selectedJob), [selectedJob]);
  const canOpenViewer = selectedJobId != null && selectedViewerReady;
  const normalizedSelectedJobStatus = selectedJob ? normalizeJobStatus(selectedJob.status) : "queued";
  const sfmResultKey = selectedJob?.sfmResultKey ?? selectedJob?.outputs?.sfmResultKey ?? null;
  const sfmResultUrl = selectedJob?.sfmResultUrl ?? selectedJob?.outputs?.sfmResultUrl ?? null;
  const gsResultKey = selectedJob?.gaussianSplatKey ?? selectedJob?.outputs?.gaussianSplatKey ?? null;
  const gsResultUrl = selectedJob?.gaussianSplatUrl ?? selectedJob?.outputs?.gaussianSplatUrl ?? selectedJob?.resultUrl ?? null;
  const keyframeStatus = String(selectedJobKeyframeSet?.status ?? "").toLowerCase();
  const keyframeReady = keyframeStatus === "ready";
  const keyframeCsvUrl = selectedJobKeyframeSet?.selectedFramesCsvKey
    ? buildPublicVideoUrl(publicStorageBaseUrl, selectedJobKeyframeSet.selectedFramesCsvKey)
    : "";
  const keyframeMetricsUrl = selectedJobKeyframeSet?.metricsKey
    ? buildPublicVideoUrl(publicStorageBaseUrl, selectedJobKeyframeSet.metricsKey)
    : "";
  const keyframeConfigUrl = selectedJobKeyframeSet?.configKey
    ? buildPublicVideoUrl(publicStorageBaseUrl, selectedJobKeyframeSet.configKey)
    : "";
  const keyframeLatentUrl = selectedJobKeyframeSet?.latentHtmlUrl
    ?? (selectedJobKeyframeSet?.latentHtmlKey
      ? buildPublicVideoUrl(publicStorageBaseUrl, selectedJobKeyframeSet.latentHtmlKey)
      : "");
  const gsReady = selectedViewerReady && normalizedSelectedJobStatus === "ready";
  const sfmReady = Boolean(sfmResultKey) && (
    canRunSelectedGs ||
    normalizedSelectedJobStatus === "waiting_gs" ||
    selectedJob?.viewerKind === "sfm" ||
    gsReady
  );
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
  const pipelineStage = String(currentProgress?.stage ?? selectedJob?.stage ?? "").toUpperCase();
  const pipelineSteps = useMemo(() => {
    const hasSelectedJob = Boolean(selectedJob);
    const isRunning = hasSelectedJob && (currentStatus === "queued" || currentStatus === "processing");
    const isFailed = hasSelectedJob && (currentStatus === "failed" || currentStatus === "canceled");
    const isKsStage = pipelineStage.includes("IMAGESET") || pipelineStage.includes("KEYFRAME");
    const isSfmStage = pipelineStage.includes("SFM") || pipelineStage.includes("UNDISTORT");
    const isGsStage = pipelineStage.includes("GS") || pipelineStage.includes("TRAINING");
    const ksDone = hasSelectedJob && (keyframeReady || sfmReady || gsReady || currentStatus === "waiting_gs" || isSfmStage || isGsStage);
    const sfmDone = hasSelectedJob && (sfmReady || gsReady || currentStatus === "waiting_gs" || isGsStage);

    return [
      {
        id: "ks" as PipelineTab,
        label: "KS",
        state: (isFailed && !ksDone ? "failed" : ksDone ? "done" : isRunning && (isKsStage || !ksDone) ? "active" : "waiting") as PipelineStepState,
        detail: selectedJobKeyframeSet
          ? `v${selectedJobKeyframeSet.version} · ${formatAutoParameterValue(selectedJobKeyframeSet.selectedFrameCount)} frames`
          : "자동 생성",
      },
      {
        id: "sfm" as PipelineTab,
        label: "SfM",
        state: (isFailed && ksDone && !sfmDone ? "failed" : sfmDone ? "done" : isRunning && isSfmStage ? "active" : "waiting") as PipelineStepState,
        detail: sfmDone ? "Point cloud ready" : "KS 완료 후 실행",
      },
      {
        id: "gs" as PipelineTab,
        label: "GS",
        state: (isFailed && sfmDone && !gsReady ? "failed" : gsReady ? "done" : isRunning && isGsStage ? "active" : "waiting") as PipelineStepState,
        detail: gsReady ? "Viewer ready" : canRunSelectedGs ? "사용자 승인 대기" : "SfM 완료 후 실행",
      },
    ];
  }, [canRunSelectedGs, currentStatus, gsReady, keyframeReady, pipelineStage, selectedJob, selectedJobKeyframeSet, sfmReady]);
  const primaryPipelineCta = useMemo<PrimaryPipelineCta>(() => {
    const primaryClass = "bg-[#1A3C34] text-[#F2F0EB] hover:bg-[#D95F39]";
    const outlineClass = "border border-[#1A3C34] text-[#1A3C34] hover:bg-[#1A3C34] hover:text-[#F2F0EB]";
    const mutedClass = "border border-[#1A3C34]/20 text-[#1A3C34]/45 bg-[#F2F0EB]";
    const dangerClass = "bg-[#D95F39] text-white hover:bg-[#1A3C34]";

    if (!selectedJob) {
      return {
        action: "create",
        label: creatingJob ? "시작 중" : "파이프라인 시작",
        description: selectedKeyframeSetIsReady && selectedKeyframeSet
          ? `선택된 KS v${selectedKeyframeSet.version} 기준으로 KS와 SfM을 실행합니다.`
          : "새 KS 버전을 자동 생성한 뒤 SfM까지 실행합니다.",
        disabled: creatingJob,
        className: primaryClass,
      };
    }

    if (currentStatus === "queued" || currentStatus === "processing") {
      return {
        action: "none",
        label: "처리 중",
        description: currentProgress?.stage ? `${currentProgress.stage} 단계가 진행 중입니다.` : "KS 또는 SfM 처리가 진행 중입니다.",
        disabled: true,
        className: mutedClass,
      };
    }

    if (currentStatus === "waiting_gs" || canRunSelectedGs) {
      return {
        action: "run-gs",
        label: creatingJob ? "GS 시작 중" : "GS 진행",
        description: "SfM 결과를 확인한 뒤 같은 Job에서 GS 학습을 시작합니다.",
        disabled: creatingJob || !canRunSelectedGs,
        className: primaryClass,
      };
    }

    if (canOpenViewer) {
      return {
        action: "viewer",
        label: "결과 보기",
        description: "완료된 3D 결과를 뷰어에서 확인합니다.",
        disabled: false,
        className: outlineClass,
      };
    }

    if (currentStatus === "failed" || currentStatus === "canceled") {
      return {
        action: "create",
        label: creatingJob ? "다시 시작 중" : "다시 시도",
        description: "새 Job을 생성해 KS부터 파이프라인을 다시 실행합니다.",
        disabled: creatingJob,
        className: dangerClass,
      };
    }

    return {
      action: "none",
      label: "대기 중",
      description: "현재 Job 상태를 확인하고 있습니다.",
      disabled: true,
      className: mutedClass,
    };
  }, [canOpenViewer, canRunSelectedGs, creatingJob, currentProgress?.stage, currentStatus, selectedJob, selectedKeyframeSet, selectedKeyframeSetIsReady]);
  const currentStageLabel = currentProgress?.stage || selectedJob?.stage || "PENDING";
  const selectedJobCreatedAt = formatDateLabel(selectedJob?.createdAt);
  const selectedJobEndedAt = formatDateLabel(selectedJob?.endedAt ?? selectedJob?.finishedAt);

  const handlePrimaryPipelineAction = () => {
    if (primaryPipelineCta.disabled) return;
    if (primaryPipelineCta.action === "create") {
      void handleCreateJob();
      return;
    }
    if (primaryPipelineCta.action === "run-gs") {
      void handleRunGs();
      return;
    }
    if (primaryPipelineCta.action === "viewer" && canOpenViewer) {
      nav(viewerPath);
    }
  };

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
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-[#1A3C34]/30">
                      Job Pipeline
                    </h3>
                    <p className="mt-2 text-[12px] font-medium leading-relaxed text-[#1A3C34]/55">
                      {selectedJob
                        ? `Job ${selectedJob.id} · ${selectedJobCreatedAt}`
                        : "파이프라인을 시작하면 KS와 SfM을 먼저 수행합니다."}
                    </p>
                  </div>
                  {selectedJob ? (
                    <StatusChip status={currentStatus} />
                  ) : (
                    <span className="w-fit px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] bg-[#F2F0EB] text-[#1A3C34]/45">
                      New
                    </span>
                  )}
                </div>

                <div className="border border-[#1A3C34]/10 bg-[#F2F0EB]/35 p-5 space-y-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1A3C34]/40">
                        Current Stage
                      </div>
                      <div className="mt-1 break-words text-lg font-black text-[#1A3C34]">
                        {currentStageLabel}
                      </div>
                    </div>
                    <div className="w-fit border border-[#1A3C34]/10 bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#1A3C34]">
                      {progressPercent}
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    {pipelineSteps.map((step, index) => (
                      <PipelineStageCard
                        key={step.label}
                        index={index + 1}
                        label={step.label}
                        state={step.state}
                        detail={step.detail}
                        active={activePipelineTab === step.id}
                        onClick={() => setActivePipelineTab(step.id)}
                      />
                    ))}
                  </div>

                  <div className="border-l-2 border-[#D95F39] bg-white px-4 py-3">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#D95F39]">
                      Next Action
                    </div>
                    <p className="mt-1 text-[12px] font-medium leading-relaxed text-[#1A3C34]/70">
                      {primaryPipelineCta.description}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <SummaryMetric label="Status" value={selectedJob ? statusLabel(currentStatus) : "New"} />
                  <SummaryMetric
                    label="Keyframes"
                    value={selectedJobKeyframeSet ? `v${selectedJobKeyframeSet.version} · ${formatAutoParameterValue(selectedJobKeyframeSet.selectedFrameCount)}` : "자동 생성"}
                  />
                  <SummaryMetric
                    label="Updated"
                    value={currentProgress?.updatedAt ? formatDateLabel(currentProgress.updatedAt) : selectedJobEndedAt !== "-" ? selectedJobEndedAt : selectedJobCreatedAt}
                  />
                </div>

                {activePipelineTab === "ks" && (
                  <div className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <ParameterCard
                        label="Version"
                        value={selectedJobKeyframeSet ? `v${selectedJobKeyframeSet.version}` : "-"}
                      />
                      <ParameterCard
                        label="Status"
                        value={selectedJobKeyframeSet ? (keyframeReady ? "Ready" : keyframeStatus || "-") : "-"}
                      />
                      <ParameterCard
                        label="Frames"
                        value={formatAutoParameterValue(selectedJobKeyframeSet?.selectedFrameCount)}
                      />
                    </div>

                    <div className="border border-[#1A3C34]/10 bg-[#F2F0EB]/35 p-4 space-y-3">
                      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1A3C34]/45">
                        KS Outputs
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {keyframeReady && keyframeLatentUrl && (
                          <ArtifactLink href={keyframeLatentUrl} label="Latent Space" />
                        )}
                        {keyframeCsvUrl && (
                          <ArtifactLink href={keyframeCsvUrl} label="CSV" />
                        )}
                        {keyframeMetricsUrl && (
                          <ArtifactLink href={keyframeMetricsUrl} label="Metrics" />
                        )}
                        {keyframeConfigUrl && (
                          <ArtifactLink href={keyframeConfigUrl} label="Config" />
                        )}
                      </div>
                    </div>

                    <details className="border border-[#1A3C34]/10 bg-white p-4">
                      <summary className="cursor-pointer list-none text-[10px] font-black uppercase tracking-[0.18em] text-[#1A3C34]/45">
                        Advanced Details
                      </summary>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <KeyValuePanel label="Storage Prefix" value={selectedJobKeyframeSet?.storagePrefix ?? "-"} />
                        <KeyValuePanel label="Selected Frames" value={selectedJobKeyframeSet?.selectedFramesPrefix ?? "-"} />
                      </div>
                    </details>

                    {selectedJobKeyframeSet?.errorMessage && (
                      <div className="border border-[#D95F39]/20 bg-[#D95F39]/10 p-4 text-[12px] font-bold text-[#D95F39]">
                        {selectedJobKeyframeSet.errorMessage}
                      </div>
                    )}
                    {selectedJobKeyframeSet?.frameIndexPlotUrl ? (
                      <img
                        src={selectedJobKeyframeSet.frameIndexPlotUrl}
                        alt={`KS v${selectedJobKeyframeSet.version} frame index comparison`}
                        className="w-full border border-[#1A3C34]/10 bg-[#F2F0EB]"
                      />
                    ) : (
                      <div className="border border-[#1A3C34]/10 bg-[#F2F0EB] p-5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#1A3C34]/45">
                        선택된 Job에 연결된 KS 시각 자료가 없습니다.
                      </div>
                    )}
                    {selectedJobKeyframeSet?.timelineComparisonUrl && (
                      <video
                        src={selectedJobKeyframeSet.timelineComparisonUrl}
                        controls
                        preload="metadata"
                        className="w-full border border-[#1A3C34]/10 bg-black"
                      />
                    )}
                  </div>
                )}

                {activePipelineTab === "sfm" && (
                  <div className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <ParameterCard label="Status" value={sfmReady ? "Ready" : "Waiting"} />
                      <ParameterCard
                        label="Viewer"
                        value={selectedJob?.viewerKind === "sfm" || sfmReady ? "Point Cloud" : "-"}
                      />
                      <ParameterCard label="Stage" value={selectedJob?.stage ?? currentProgress?.stage ?? "-"} />
                    </div>
                    <div className="border border-[#1A3C34]/10 bg-[#F2F0EB]/45 p-5 space-y-3">
                      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1A3C34]/45">
                        SfM Result
                      </div>
                      <div className="text-[12px] font-medium leading-relaxed text-[#1A3C34]/65">
                        {sfmReady ? "포인트 클라우드 결과가 준비되었습니다." : "아직 SfM 포인트 클라우드가 생성되지 않았습니다."}
                      </div>
                      {sfmReady && (
                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => nav(sfmViewerPath)}
                            className="inline-flex h-9 items-center border border-[#1A3C34] bg-[#1A3C34] px-3 text-[10px] font-black uppercase tracking-[0.14em] text-[#F2F0EB] hover:bg-[#D95F39] hover:border-[#D95F39]"
                          >
                            View Point Cloud
                          </button>
                          {sfmResultUrl && (
                            <a
                              href={sfmResultUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex h-9 items-center border border-[#1A3C34] px-3 text-[10px] font-black uppercase tracking-[0.14em] text-[#1A3C34] hover:bg-[#1A3C34] hover:text-[#F2F0EB]"
                            >
                              Download PLY
                            </a>
                          )}
                        </div>
                      )}
                      {sfmResultKey && (
                        <details className="pt-2">
                          <summary className="cursor-pointer list-none text-[10px] font-black uppercase tracking-[0.16em] text-[#1A3C34]/40">
                            File Details
                          </summary>
                          <div className="mt-3 break-all border border-[#1A3C34]/10 bg-white p-3 text-[11px] font-medium text-[#1A3C34]/60">
                            {sfmResultKey}
                          </div>
                        </details>
                      )}
                    </div>
                  </div>
                )}

                {activePipelineTab === "gs" && (
                  <div className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <ParameterCard label="Status" value={gsReady ? "Ready" : canRunSelectedGs ? "Runnable" : "Waiting"} />
                      <ParameterCard label="Iterations" value={formatAutoParameterValue(selectedJob?.iteration)} />
                      <ParameterCard label="Postable" value={selectedPostable ? "Yes" : "No"} />
                    </div>
                    <div className="border border-[#1A3C34]/10 bg-[#F2F0EB]/45 p-5 space-y-3">
                      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1A3C34]/45">
                        GS Result
                      </div>
                      <div className="text-[12px] font-medium leading-relaxed text-[#1A3C34]/65">
                        {gsReady ? "Gaussian Splatting 결과가 준비되었습니다." : "GS 결과는 SfM 완료 후 실행할 수 있습니다."}
                      </div>
                      {gsReady && gsResultUrl && (
                        <a
                          href={gsResultUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-9 items-center border border-[#D95F39] px-3 text-[10px] font-black uppercase tracking-[0.14em] text-[#D95F39] hover:bg-[#D95F39] hover:text-white"
                        >
                          Open Result
                        </a>
                      )}
                      {gsReady && gsResultKey && (
                        <details className="pt-2">
                          <summary className="cursor-pointer list-none text-[10px] font-black uppercase tracking-[0.16em] text-[#1A3C34]/40">
                            File Details
                          </summary>
                          <div className="mt-3 break-all border border-[#1A3C34]/10 bg-white p-3 text-[11px] font-medium text-[#1A3C34]/60">
                            {gsResultKey}
                          </div>
                        </details>
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>

            <div className="lg:col-span-4 space-y-8">
              <div className="bg-white border border-[#1A3C34]/10 p-10 space-y-10">
                <div className="space-y-6">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-[12px] font-black uppercase tracking-[0.4em] text-[#1A3C34]">
                      Pipeline Job
                    </h4>
                    {selectedJob ? (
                      <StatusChip status={currentStatus} />
                    ) : (
                      <span className="px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] bg-[#F2F0EB] text-[#1A3C34]/45">
                        New
                      </span>
                    )}
                  </div>

                  <div className="border border-[#1A3C34]/10 bg-[#F2F0EB]/35 px-4 py-3">
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1A3C34]/40">
                      Selected Job
                    </div>
                    <div className="mt-1 text-[13px] font-black text-[#1A3C34]">
                      {selectedJobId != null ? `Job ${selectedJobId}` : "New Job"}
                    </div>
                    <div className="mt-1 truncate text-[11px] font-medium text-[#1A3C34]/55">
                      {currentStageLabel}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handlePrimaryPipelineAction}
                    disabled={primaryPipelineCta.disabled}
                    className={`w-full h-12 text-[11px] font-black uppercase tracking-[0.2em] transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${primaryPipelineCta.className}`}
                  >
                    {primaryPipelineCta.label}
                  </button>

                  <p className="text-[11px] font-medium text-[#1A3C34]/50 leading-relaxed">
                    {primaryPipelineCta.description}
                  </p>
                </div>

                <Separator className="bg-[#1A3C34]/10" />

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h5 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#1A3C34]/60">Job History</h5>
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#1A3C34]/35">
                      {jobs.length} jobs
                    </span>
                  </div>
                  {jobs.length === 0 ? (
                    <div className="text-[11px] font-bold text-[#1A3C34]/35 uppercase tracking-[0.16em]">
                      생성된 Job이 없습니다.
                    </div>
                  ) : (
                    <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                      {jobs.map((job) => {
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
                              {(job.canRunGs || normalizeJobStatus(job.status) === "waiting_gs") && (
                                <span className="px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] border border-[#1A3C34] text-[#1A3C34]">
                                  GS Ready
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
                      })}
                    </div>
                  )}
                </div>

                <Separator className="bg-[#1A3C34]/10" />

                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#1A3C34]/60">
                      Keyframe Versions
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#1A3C34]/35">
                      {keyframeSets.length} versions
                    </span>
                  </summary>

                  <div className="mt-5 space-y-3">
                    {keyframeSets.length === 0 ? (
                      <div className="border border-[#1A3C34]/10 bg-[#F2F0EB] p-4 text-[11px] font-bold text-[#1A3C34]/45 uppercase tracking-[0.14em]">
                        첫 Job 생성 시 같은 Job에서 KS가 자동 생성됩니다.
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
                      <div className="flex items-center justify-between gap-3 border border-[#1A3C34]/10 px-4 py-3">
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
                    )}
                  </div>
                </details>
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
    waiting_gs: { label: "Waiting GS", className: "border border-[#1A3C34] text-[#1A3C34]" },
    ready: { label: "Ready", className: "bg-[#1A3C34] text-[#F2F0EB]" },
    failed: { label: "Failed", className: "bg-[#D95F39] text-white" },
    canceled: { label: "Canceled", className: "border border-[#D95F39] text-[#D95F39]" },
  };
  const item = config[status] ?? config.queued;
  return <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] ${item.className}`}>{item.label}</span>;
}

function PipelineStageCard({
  index,
  label,
  state,
  detail,
  active,
  onClick,
}: {
  index: number;
  label: string;
  state: PipelineStepState;
  detail: string;
  active: boolean;
  onClick: () => void;
}) {
  const config: Record<PipelineStepState, { label: string; dotClassName: string; cardClassName: string; textClassName: string }> = {
    waiting: {
      label: "Waiting",
      dotClassName: "border border-[#1A3C34]/25 bg-white",
      cardClassName: "border-[#1A3C34]/10 bg-white",
      textClassName: "text-[#1A3C34]/40",
    },
    active: {
      label: "Active",
      dotClassName: "bg-[#D95F39] animate-pulse",
      cardClassName: "border-[#D95F39]/40 bg-white",
      textClassName: "text-[#D95F39]",
    },
    done: {
      label: "Done",
      dotClassName: "bg-[#1A3C34]",
      cardClassName: "border-[#1A3C34]/20 bg-white",
      textClassName: "text-[#1A3C34]",
    },
    failed: {
      label: "Failed",
      dotClassName: "bg-[#D95F39]",
      cardClassName: "border-[#D95F39]/40 bg-[#D95F39]/5",
      textClassName: "text-[#D95F39]",
    },
  };
  const item = config[state] ?? config.waiting;
  const activeClassName = active
    ? "border-[#D95F39] bg-[#D95F39]/10"
    : item.cardClassName;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-w-0 border p-4 text-left transition-colors hover:border-[#D95F39]/60 ${activeClassName}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="shrink-0 text-[10px] font-black uppercase tracking-[0.14em] text-[#1A3C34]/35">
            0{index}
          </span>
          <span className="truncate text-[14px] font-black uppercase tracking-[0.12em] text-[#1A3C34]">
            {label}
          </span>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-2 text-[9px] font-black uppercase tracking-[0.12em] ${item.textClassName}`}>
          <span className={`h-2 w-2 shrink-0 rounded-full ${item.dotClassName}`} />
          {item.label}
        </span>
      </div>
      <div className="mt-3 text-[11px] font-medium leading-relaxed text-[#1A3C34]/55">
        {detail}
      </div>
    </button>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#1A3C34]/10 bg-white px-4 py-3">
      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1A3C34]/35">{label}</div>
      <div className="mt-1 truncate text-[13px] font-black text-[#1A3C34]">{value}</div>
    </div>
  );
}

function ParameterCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#1A3C34]/10 bg-[#F2F0EB]/35 p-4">
      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1A3C34]/40">{label}</div>
      <div className="mt-2 break-words text-base font-black text-[#1A3C34]">{value}</div>
    </div>
  );
}

function KeyValuePanel({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#1A3C34]/10 bg-[#F2F0EB]/45 p-4">
      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1A3C34]/40">{label}</div>
      <div className="mt-2 break-all text-[12px] font-medium text-[#1A3C34]/65">{value}</div>
    </div>
  );
}

function ArtifactLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex h-9 items-center border border-[#1A3C34] px-3 text-[10px] font-black uppercase tracking-[0.14em] text-[#1A3C34] hover:bg-[#1A3C34] hover:text-[#F2F0EB]"
    >
      {label}
    </a>
  );
}
