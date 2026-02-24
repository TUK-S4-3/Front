import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { clearToken } from "../api/http";
import { getUpload } from "../api/uploads";
import type { Upload } from "../api/types";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import {
  ArrowLeft, Download, Box, CheckCircle2,
  AlertCircle, FileVideo, HardDrive, RefreshCw, Loader2, Sparkles
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

  if (loading)
    return (
      <Layout>
        <div className="bg-[#F2F0EB] min-h-screen pt-28 flex items-center justify-center">
          <div className="flex flex-col items-center gap-6">
             <Loader2 className="h-10 w-10 animate-spin text-[#1A3C34]" />
             <p className="text-[11px] font-bold text-[#1A3C34]/30 uppercase tracking-[0.4em]">Decoding Asset Geometry</p>
          </div>
        </div>
      </Layout>
    );

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
                <Sparkles size={14} /> Analysis Report
              </div>
              <h1 className="text-5xl md:text-7xl font-serif italic tracking-tight">
                Project <span className="font-sans not-italic font-black text-[#1A3C34] uppercase">Identity</span>
              </h1>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold bg-[#1A3C34] text-[#F2F0EB] px-3 py-1 uppercase tracking-tighter">
                  ID: {data?.id}
                </span>
                <span className="text-[10px] font-bold text-[#1A3C34]/40 uppercase tracking-widest border-l border-[#1A3C34]/20 pl-3">
                  Digital Twin Record
                </span>
              </div>
            </div>

            {data?.status === "COMPLETED" && (
              <Button
                className="group relative flex items-center gap-6 bg-[#1A3C34] px-12 h-20 text-[14px] font-bold text-[#F2F0EB] transition-all hover:bg-[#D95F39] rounded-none shadow-2xl"
                onClick={() => alert(`Downloading: ${data.resultFileKey}`)}
              >
                DOWNLOAD MASTER ASSET
                <Download size={18} />
              </Button>
            )}
          </div>

          {err && (
            <div className="bg-[#D95F39]/10 border border-[#D95F39]/20 p-6 flex items-center gap-4 text-[#D95F39] text-xs font-black uppercase tracking-widest">
              <AlertCircle size={20} /> {err}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
   
            <div className="lg:col-span-8 space-y-10">
              
        
              <div className="bg-white border border-[#1A3C34]/10 p-10">
                <div className="flex items-center justify-between mb-12">
                  <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-[#1A3C34]/30">Synthesis Pipeline</h3>
                  <div className="h-[1px] flex-1 mx-8 bg-[#1A3C34]/5" />
                </div>
                
                <div className="relative flex justify-between items-start max-w-2xl mx-auto px-4">
                  <ProgressStep label="Capture" active={true} completed={true} />
                  <ProgressStep
                    label="Synthesize"
                    active={data?.status === "PROCESSING" || data?.status === "COMPLETED"}
                    completed={data?.status === "COMPLETED"}
                  />
                  <ProgressStep
                    label="Archive"
                    active={data?.status === "COMPLETED"}
                    completed={data?.status === "COMPLETED"}
                  />
                </div>
              </div>

  
              <div className="relative aspect-video bg-white border border-[#1A3C34]/10 overflow-hidden flex flex-col items-center justify-center text-center p-12">
                {data?.status === "COMPLETED" ? (
                  <div className="space-y-8">
                    <div className="mx-auto h-24 w-24 bg-[#F2F0EB] flex items-center justify-center text-[#1A3C34] border border-[#1A3C34]/10">
                      <Box size={40} className="animate-pulse" />
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-3xl font-serif italic text-[#1A3C34]">Preservation Complete</h3>
                      <p className="text-[#1A3C34]/50 text-[13px] font-medium max-w-xs mx-auto leading-relaxed">
                        Geometric reconstruction is finalized. Digital asset is now ready for deployment.
                      </p>
                    </div>

                    <button className="text-[11px] font-bold uppercase tracking-[0.4em] text-[#D95F39] border-b border-[#D95F39] pb-1 hover:opacity-50 transition-opacity">
                      Enter 3D Preview
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <Loader2 className="h-12 w-12 text-[#1A3C34]/20 animate-spin mx-auto" />
                    <p className="text-[12px] font-bold uppercase tracking-[0.3em] text-[#1A3C34]/30">
                      Generating Spatial Data...
                    </p>
                  </div>
                )}
              </div>
            </div>


            <div className="lg:col-span-4 space-y-8">
              <div className="bg-white border border-[#1A3C34]/10 p-10 space-y-10">
                <h4 className="text-[12px] font-black uppercase tracking-[0.4em] text-[#1A3C34]">Metadata</h4>
                
                <div className="space-y-8">
                  <InfoItem icon={<FileVideo size={16} />} label="Source Key" value={data?.originalFileKey} />
                  <InfoItem icon={<HardDrive size={16} />} label="Result Key" value={data?.resultFileKey || "Analyzing..."} />
                  
                  <Separator className="bg-[#1A3C34]/10" />

                  <div className="space-y-4">
                    <TimeRow label="Archive Date" value={data?.createdAt} />
                    <TimeRow label="Finalized" value={data?.completedAt} isHighlight />
                  </div>
                </div>
              </div>

              <div className="bg-[#1A3C34] p-10 text-[#F2F0EB] space-y-6">
                <div className="flex items-center gap-3 text-[#D95F39]">
                  <CheckCircle2 size={18} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Compatibility</span>
                </div>
                <p className="text-[13px] leading-relaxed opacity-60 font-medium">
                  Validated for <span className="text-[#F2F0EB] font-bold">Omniverse, Unreal Engine</span>, and web-based AR standards.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}

function ProgressStep({ label, active, completed }: { label: string; active: boolean; completed: boolean }) {
  return (
    <div className="flex flex-col items-center gap-4 z-10">
      <div
        className={`h-12 w-12 flex items-center justify-center border transition-all duration-1000 ${
          completed
            ? "bg-[#1A3C34] border-[#1A3C34] text-[#F2F0EB]"
            : active
            ? "bg-white border-[#D95F39] text-[#D95F39]"
            : "bg-[#F2F0EB] border-[#1A3C34]/5 text-[#1A3C34]/10"
        }`}
      >
        {completed ? <CheckCircle2 size={20} /> : <div className={`h-1.5 w-1.5 bg-current ${active ? 'animate-pulse' : ''}`} />}
      </div>
      <span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${active ? "text-[#1A3C34]" : "text-[#1A3C34]/20"}`}>
        {label}
      </span>
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-[9px] font-bold text-[#1A3C34]/30 uppercase tracking-[0.2em]">
        {icon} {label}
      </div>
      <div className="text-[12px] font-bold bg-[#F2F0EB] p-4 border border-[#1A3C34]/5 break-all text-[#1A3C34]">
        {value || "---"}
      </div>
    </div>
  );
}

function TimeRow({ label, value, isHighlight }: { label: string; value?: string | null; isHighlight?: boolean }) {
  return (
    <div className="flex justify-between items-center text-[10px]">
      <span className="text-[#1A3C34]/30 font-bold uppercase tracking-widest">{label}</span>
      <span className={`font-bold tracking-tighter ${isHighlight ? "text-[#D95F39]" : "text-[#1A3C34]/60"}`}>
        {value ? new Date(value).toLocaleDateString('ko-KR') : "Pending"}
      </span>
    </div>
  );
}