import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearToken, getToken } from "../api/http";
import { createUpload, myUploads } from "../api/uploads";
import type { Upload } from "../api/types";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { 
  UploadCloud, RefreshCw, FileText, 
  CheckCircle2, ChevronRight, 
  Layers, HardDrive, Sparkles
} from "lucide-react";

export default function UploadsPage() {
  const nav = useNavigate();
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [err, setErr] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const stats = useMemo(() => ({
    total: uploads.length,
    completed: uploads.filter(u => u.status === "COMPLETED").length,
    processing: uploads.filter(u => u.status === "PROCESSING").length,
  }), [uploads]);

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

            <button
              onClick={() => refresh()}
              disabled={isRefreshing}
              className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-[#1A3C34] hover:opacity-50 transition-opacity"
            >
              <RefreshCw size={16} className={`${isRefreshing ? "animate-spin" : ""}`} />
              Sync Archive
            </button>
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
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                  <label 
                    htmlFor="file-upload" 
                    className="flex flex-col items-center justify-center aspect-video bg-[#F2F0EB] border border-dashed border-[#1A3C34]/20 hover:border-[#D95F39] transition-all cursor-pointer group"
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

                <Button
                  disabled={!file || loading}
                  onClick={handleUpload}
                  className="w-full h-16 rounded-none bg-[#1A3C34] hover:bg-[#D95F39] text-[#F2F0EB] font-black text-[13px] tracking-[0.2em] transition-all"
                >
                  {loading ? <RefreshCw className="animate-spin" /> : "INITIALIZE ARCHIVE"}
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
                    {uploads.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-24 text-center text-[#1A3C34]/20 font-bold uppercase tracking-[0.3em] text-sm">No Assets Found</td>
                      </tr>
                    ) : (
                      uploads.map((u) => (
                        <tr 
                          key={u.id}
                          className="group hover:bg-[#F2F0EB]/50 cursor-pointer transition-colors"
                          onClick={() => u.id && nav(`/uploads/${u.id}`)}
                        >
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-[#F2F0EB] flex items-center justify-center text-[#1A3C34] group-hover:bg-[#D95F39] group-hover:text-white transition-all">
                                <HardDrive size={18} />
                              </div>
                              <div>
                                <div className="text-[14px] font-black uppercase tracking-tighter text-[#1A3C34]">ARV-{String(u.id).slice(-4)}</div>
                                <div className="text-[10px] opacity-30 font-bold uppercase">Stored Geometry</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-6 text-center">
                             <StatusTag status={u.status} />
                          </td>
                          <td className="px-8 py-6 text-right">
                            <ChevronRight size={18} className="ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-[#D95F39]" />
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

function StatCard({ label, value, icon, active }: { label: string; value: number; icon: any; active?: boolean }) {
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
    COMPLETED: { label: 'Archived', color: 'bg-[#1A3C34] text-[#F2F0EB]' },
    PROCESSING: { label: 'Synthesizing', color: 'border border-[#1A3C34] text-[#1A3C34] animate-pulse' },
    FAILED: { label: 'System Error', color: 'bg-[#D95F39] text-white' },
    PENDING: { label: 'Queued', color: 'bg-[#F2F0EB] text-[#1A3C34]/40' },
  };
  const c = config[status] || config.PENDING;
  return (
    <span className={`px-4 py-1 text-[9px] font-black uppercase tracking-[0.15em] ${c.color}`}>
      {c.label}
    </span>
  );
}