import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { clearToken } from "../api/http";
import { getUpload } from "../api/uploads";
import type { Upload } from "../api/types";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import {
  ArrowLeft,
  Download,
  Box,
  CheckCircle2,
  AlertCircle,
  FileVideo,
  HardDrive,
  RefreshCw,
  Loader2,
  Sparkles,
} from "lucide-react";

export default function UploadDetailPage() {
  const nav = useNavigate();
  const { id } = useParams();
  const uploadId = Number(id);

  const [data, setData] = useState<Upload | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!Number.isFinite(uploadId)) {
      setErr("유효하지 않은 요청 ID입니다.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await getUpload(uploadId);
        setData(res.upload);
      } catch (e: any) {
        const msg = String(e?.message ?? e);
        setErr(msg);
        if (msg.includes("401") || msg.includes("403")) {
          clearToken();
          nav("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [uploadId, nav]);

  if (loading) {
    return (
      <Layout>
        <div className="bg-[#F8FAFC] min-h-screen pt-28 flex items-center justify-center px-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-[#0055FF]" />
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.35em]">
              Loading archive
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-[#F8FAFC] min-h-screen pt-28 pb-20 px-6 text-[#1E293B]">
        <div className="max-w-6xl mx-auto space-y-10">

          <div className="flex items-center justify-between">
            <Link
              to="/uploads"
              className="group inline-flex items-center gap-3 text-slate-500 hover:text-slate-900 transition-colors font-black text-[11px] uppercase tracking-[0.25em]"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Return to Archives
            </Link>

            <button
              onClick={() => window.location.reload()}
              className="text-slate-400 hover:text-[#0055FF] transition-colors"
              aria-label="Refresh"
              type="button"
            >
              <RefreshCw size={18} />
            </button>
          </div>

      
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-slate-200 pb-10">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 text-slate-400 text-[11px] font-black uppercase tracking-[0.35em]">
                <Sparkles size={14} className="text-[#0055FF]" />
                Analysis Report
              </div>

              <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900">
                Archive <span className="text-[#0055FF]">Details</span>
              </h1>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <span className="text-[10px] font-black bg-[#0F172A] text-white px-3 py-1 rounded-full uppercase tracking-widest">
                  ID: {data?.id}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Digital twin record
                </span>
              </div>
            </div>

            {data?.status === "COMPLETED" && (
              <Button
                className="group inline-flex items-center gap-3 rounded-2xl bg-[#0055FF] hover:bg-slate-900 text-white px-8 h-14 font-black uppercase tracking-[0.2em] text-[11px] transition-all"
                onClick={() => alert(`Downloading: ${data.resultFileKey}`)}
              >
                Download result
                <Download size={16} />
              </Button>
            )}
          </div>

 
          {err && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-rose-700 flex items-center gap-3">
              <AlertCircle size={16} />
              <span className="text-[12px] font-bold">{err}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            <div className="lg:col-span-8 space-y-8">
  
  
              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5">
                <div className="flex items-center justify-between mb-8">
                  <div className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">
                    Processing pipeline
                  </div>
                  <div className="h-px flex-1 mx-6 bg-slate-100" />
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {data?.status ?? "UNKNOWN"}
                  </div>
                </div>

                <div className="relative flex justify-between items-start max-w-2xl mx-auto px-2">
                  <ProgressStep label="Upload" active completed />
                  <ProgressStep
                    label="Reconstruct"
                    active={data?.status === "PROCESSING" || data?.status === "COMPLETED"}
                    completed={data?.status === "COMPLETED"}
                  />
                  <ProgressStep
                    label="Finalize"
                    active={data?.status === "COMPLETED"}
                    completed={data?.status === "COMPLETED"}
                  />
                </div>
              </div>

    
    
              <div className="relative rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xl shadow-slate-900/5">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,85,255,0.08)_0%,rgba(255,255,255,0)_55%)]" />
                <div className="relative min-h-[420px] flex flex-col items-center justify-center text-center p-10">
                  {data?.status === "COMPLETED" ? (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                      <div className="mx-auto h-20 w-20 rounded-3xl bg-[#F8FAFC] border border-slate-200 flex items-center justify-center text-[#0055FF]">
                        <Box size={34} className="animate-pulse" />
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-2xl font-black tracking-tight text-slate-900">
                          3D Asset Ready
                        </h3>
                        <p className="text-slate-500 text-[13px] font-medium max-w-sm mx-auto leading-relaxed">
                          Reconstruction finished. Your archive is ready for viewing and export.
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
                        <Button
                          className="rounded-2xl bg-[#0055FF] hover:bg-slate-900 text-white h-12 px-6 font-black uppercase tracking-[0.2em] text-[11px]"
                          onClick={() => alert("Open viewer")}
                        >
                          Open viewer
                        </Button>
                        <button
                          type="button"
                          className="text-[11px] font-black uppercase tracking-[0.25em] text-[#0055FF] border-b border-[#0055FF] pb-1 hover:opacity-60 transition-opacity"
                          onClick={() => alert("Preview")}
                        >
                          Quick preview
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6 animate-in fade-in duration-500">
                      <div className="mx-auto h-16 w-16 rounded-2xl bg-[#F8FAFC] border border-slate-200 flex items-center justify-center">
                        <Loader2 className="h-7 w-7 text-[#0055FF] animate-spin" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-[16px] font-black text-slate-900">
                          Processing archive…
                        </p>
                        <p className="text-slate-500 text-[12px] font-medium">
                          We are reconstructing geometry. Please check back soon.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>


            <div className="lg:col-span-4 space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5">
                <div className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">
                  Metadata
                </div>

                <div className="mt-6 space-y-6">
                  <InfoItem
                    icon={<FileVideo size={16} className="text-slate-400" />}
                    label="Source Key"
                    value={data?.originalFileKey}
                  />
                  <InfoItem
                    icon={<HardDrive size={16} className="text-slate-400" />}
                    label="Result Key"
                    value={data?.resultFileKey || "Processing…"}
                  />

                  <Separator className="bg-slate-100" />

                  <div className="space-y-3">
                    <TimeRow label="Requested" value={data?.createdAt} />
                    <TimeRow label="Finalized" value={data?.completedAt} highlight />
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-[#0F172A] p-8 text-white">
                <div className="flex items-center gap-3 text-white/80">
                  <CheckCircle2 size={18} className="text-[#0055FF]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.25em]">
                    Compatibility
                  </span>
                </div>
                <p className="mt-3 text-[13px] leading-relaxed text-white/65 font-medium">
                  Export-ready for{" "}
                  <span className="text-white font-bold">Blender, Unity, Unreal</span>, and
                  web viewers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}


function ProgressStep({
  label,
  active,
  completed,
}: {
  label: string;
  active: boolean;
  completed: boolean;
}) {
  const cls = completed
    ? "bg-[#0055FF] border-[#0055FF] text-white"
    : active
    ? "bg-white border-[#0055FF] text-[#0055FF]"
    : "bg-[#F8FAFC] border-slate-200 text-slate-300";

  return (
    <div className="flex flex-col items-center gap-3 z-10">
      <div
        className={`h-12 w-12 rounded-2xl flex items-center justify-center border transition-all duration-500 ${cls}`}
      >
        {completed ? (
          <CheckCircle2 size={18} />
        ) : (
          <div className={`h-2 w-2 rounded-full bg-current ${active ? "animate-pulse" : ""}`} />
        )}
      </div>
      <span className={`text-[10px] font-black uppercase tracking-widest ${active ? "text-slate-900" : "text-slate-400"}`}>
        {label}
      </span>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">
        {icon} {label}
      </div>
      <div className="rounded-2xl bg-[#F8FAFC] border border-slate-200 px-4 py-3 text-[12px] font-bold text-slate-700 break-all">
        {value || "-"}
      </div>
    </div>
  );
}

function TimeRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value?: string | null;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between items-center text-[11px]">
      <span className="text-slate-400 font-black uppercase tracking-widest">{label}</span>
      <span className={`font-bold ${highlight ? "text-[#0055FF]" : "text-slate-600"}`}>
        {value ? new Date(value).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" }) : "-"}
      </span>
    </div>
  );
}