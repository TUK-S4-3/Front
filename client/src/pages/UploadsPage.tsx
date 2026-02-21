import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearToken, getToken } from "../api/http";
import { createUpload, myUploads } from "../api/uploads";
import type { Upload } from "../api/types";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import {
  UploadCloud,
  RefreshCw,
  FileText,
  CheckCircle2,
  ChevronRight,
  Layers,
  HardDrive,
  Sparkles,
  AlertCircle,
} from "lucide-react";

export default function UploadsPage() {
  const nav = useNavigate();
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [err, setErr] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const stats = useMemo(
    () => ({
      total: uploads.length,
      completed: uploads.filter((u) => u.status === "COMPLETED").length,
      processing: uploads.filter((u) => u.status === "PROCESSING").length,
    }),
    [uploads]
  );

  async function refresh(isAuto = false) {
    if (!isAuto) setIsRefreshing(true);
    try {
      const res = await myUploads();
      setUploads(Array.isArray(res.uploads) ? res.uploads : []);
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      setErr(msg);
      if (msg.includes("401") || msg.includes("403")) {
        clearToken();
        nav("/login");
      }
    } finally {
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    if (!getToken()) {
      nav("/login");
      return;
    }
    refresh();
    const t = setInterval(() => refresh(true), 5000);
    return () => clearInterval(t);

  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setErr("");
    setLoading(true);
    try {

      await createUpload();
      setFile(null);
      await refresh();
    } catch (e: any) {
      setErr("업로드 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] pt-28 pb-20 px-6">
        <div className="mx-auto max-w-6xl space-y-10">
   
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 text-slate-400 text-[11px] font-black uppercase tracking-[0.35em]">
                <Sparkles size={14} className="text-[#0055FF]" />
                Studio Workspace
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900">
                Archive <span className="text-[#0055FF]">Manager</span>
              </h1>
              <p className="text-slate-500 font-medium max-w-xl">
                Upload a video, track processing, and retrieve your archived 3D asset.
              </p>
            </div>

            <button
              onClick={() => refresh()}
              disabled={isRefreshing}
              className="group inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.25em] text-slate-500 hover:text-slate-900 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={`${isRefreshing ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`}
              />
              Sync
            </button>
          </div>


          {err && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-rose-700 flex items-center gap-3">
              <AlertCircle size={16} />
              <span className="text-[12px] font-bold">{err}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard label="Total Assets" value={stats.total} icon={<Layers size={18} />} />
            <StatCard
              label="Processing"
              value={stats.processing}
              icon={<RefreshCw size={18} />}
              highlight
            />
            <StatCard label="Completed" value={stats.completed} icon={<CheckCircle2 size={18} />} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
     
            <div className="lg:col-span-5">
              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5 space-y-6">
                <div className="space-y-2">
                  <div className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">
                    New Upload
                  </div>
                  <h3 className="text-xl font-black tracking-tight text-slate-900">
                    Create an archive
                  </h3>
                  <p className="text-[13px] text-slate-500 font-medium">
                    Select a video file to start reconstruction.
                  </p>
                </div>

                <div className="relative">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                  <label
                    htmlFor="file-upload"
                    className="group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-[#F8FAFC] px-6 py-10 hover:bg-white hover:border-[#0055FF]/40 transition-all cursor-pointer"
                  >
                    <div className="h-12 w-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-[#0055FF] group-hover:scale-105 transition-transform">
                      <UploadCloud size={22} />
                    </div>
                    <div className="mt-4 text-center">
                      <div className="text-[13px] font-black text-slate-900">
                        Click to choose a file
                      </div>
                      <div className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        MP4 / MOV • max 100MB
                      </div>
                    </div>
                  </label>
                </div>

                {file && (
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-[#F8FAFC] border border-slate-200 flex items-center justify-center text-slate-500">
                      <FileText size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-black text-slate-900 truncate">
                        {file.name}
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </div>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#0055FF]">
                      Ready
                    </span>
                  </div>
                )}

                <Button
                  disabled={!file || loading}
                  onClick={handleUpload}
                  className="w-full h-14 rounded-2xl bg-[#0055FF] hover:bg-slate-900 text-white font-black text-[12px] uppercase tracking-[0.25em] transition-all active:scale-[0.99]"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Initializing
                    </>
                  ) : (
                    "Initialize archive"
                  )}
                </Button>

                <div className="rounded-2xl bg-[#0F172A] text-white px-5 py-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/50">
                    Tip
                  </div>
                  <div className="mt-1 text-[12px] font-bold text-white/80">
                    Keep the object centered and move slowly for best reconstruction.
                  </div>
                </div>
              </div>
            </div>

        
            <div className="lg:col-span-7">
              <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xl shadow-slate-900/5">
                <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">
                      History
                    </div>
                    <div className="text-xl font-black tracking-tight text-slate-900">
                      Recent activity
                    </div>
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Live sync • 5s
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-[#0F172A] text-[10px] font-black text-white/50 uppercase tracking-[0.25em]">
                      <tr>
                        <th className="px-8 py-4">Asset</th>
                        <th className="px-4 py-4">Status</th>
                        <th className="px-8 py-4 text-right">Open</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {uploads.length === 0 ? (
                        <tr>
                          <td
                            colSpan={3}
                            className="py-20 text-center text-slate-300 font-black uppercase tracking-[0.35em] text-[11px]"
                          >
                            No records yet
                          </td>
                        </tr>
                      ) : (
                        uploads.map((u) => (
                          <tr
                            key={u.id}
                            className="group hover:bg-[#F8FAFC] cursor-pointer transition-colors"
                            onClick={() => u.id && nav(`/uploads/${u.id}`)}
                          >
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-2xl bg-[#F8FAFC] border border-slate-200 flex items-center justify-center text-slate-600 group-hover:text-[#0055FF] transition-colors">
                                  <HardDrive size={18} />
                                </div>
                                <div>
                                  <div className="text-[13px] font-black tracking-tight text-slate-900">
                                    ARV-{String(u.id).slice(-4)}
                                  </div>
                                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                    Ref {String(u.id).slice(0, 8)}…
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-5">
                              <StatusTag status={u.status} />
                            </td>

                            <td className="px-8 py-5 text-right">
                              <ChevronRight
                                size={18}
                                className="ml-auto text-slate-200 group-hover:text-[#0055FF] group-hover:translate-x-1 transition-all"
                              />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Tip: Click a row to open the detail page.
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}



function StatCard({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl border p-7 flex items-center justify-between shadow-xl shadow-slate-900/5 ${
        highlight
          ? "border-[#0055FF]/20 bg-white"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="space-y-1">
        <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
          {label}
        </div>
        <div className="text-4xl font-black tracking-tighter text-slate-900">{value}</div>
      </div>
      <div
        className={`h-12 w-12 rounded-2xl flex items-center justify-center border ${
          highlight
            ? "bg-[#0055FF] text-white border-[#0055FF]"
            : "bg-[#F8FAFC] text-slate-500 border-slate-200"
        }`}
      >
        {icon}
      </div>
    </div>
  );
}

function StatusTag({ status }: { status: string }) {
  const config: Record<string, { label: string; cls: string }> = {
    COMPLETED: { label: "Archived", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    PROCESSING: { label: "Processing", cls: "bg-blue-50 text-[#0055FF] border-blue-200 animate-pulse" },
    FAILED: { label: "Failed", cls: "bg-rose-50 text-rose-700 border-rose-200" },
    PENDING: { label: "Queued", cls: "bg-slate-50 text-slate-500 border-slate-200" },
  };
  const c = config[status] || config.PENDING;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${c.cls}`}
    >
      <span className={`h-2 w-2 rounded-full bg-current ${status === "PROCESSING" ? "animate-pulse" : ""}`} />
      {c.label}
    </span>
  );
}