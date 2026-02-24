import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { AlertCircle, ArrowLeft, Copy, ExternalLink, Share2, Info, Loader2, CheckCircle2, Sparkles } from "lucide-react";
import { getPublicGalleryItem, type PublicGalleryItem } from "../api/public";

export default function ShowcaseDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const itemId = Number(id);

  const [item, setItem] = useState<PublicGalleryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(itemId)) {
      setErr("유효하지 않은 접근입니다.");
      setLoading(false);
      return;
    }

    (async () => {
      setErr("");
      setLoading(true);
      try {
        const res = await getPublicGalleryItem(itemId);
        setItem(res.item ?? null);
      } catch (e: any) {
        setErr(String(e?.message ?? e));
      } finally {
        setLoading(false);
      }
    })();
  }, [itemId]);

  const shareUrl = item?.shareUrl || `${window.location.origin}/showcase/${itemId}`;

  const copyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const t = document.createElement("textarea");
      t.value = shareUrl;
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      document.body.removeChild(t);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading)
    return (
      <Layout>
        <div className="bg-[#F2F0EB] min-h-screen pt-28 flex items-center justify-center">
          <div className="flex flex-col items-center gap-6">
             <Loader2 className="h-10 w-10 animate-spin text-[#1A3C34]" />
             <p className="text-[11px] font-bold text-[#1A3C34]/30 uppercase tracking-[0.4em]">Rendering Visual Archive</p>
          </div>
        </div>
      </Layout>
    );

  return (
    <Layout>
      <div className="bg-[#F2F0EB] min-h-screen pt-28 pb-20 px-6 text-[#2D2D2D]">
        <div className="max-w-6xl mx-auto space-y-12">
          

          <div className="flex items-center justify-between">
            <Link 
              to="/showcase" 
              className="group flex items-center gap-3 text-[#1A3C34]/40 hover:text-[#1A3C34] transition-colors font-bold text-[11px] uppercase tracking-widest"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
              Back to Showcase
            </Link>

            <div className="flex items-center gap-3">
              <Badge variant="outline" className="border-[#1A3C34]/20 bg-white text-[#1A3C34] font-bold px-3 py-1 rounded-none text-[9px] tracking-[0.2em] uppercase">
                Public Exhibition
              </Badge>
              <div className="w-1.5 h-1.5 rounded-full bg-[#D95F39]" />
            </div>
          </div>

          {err && (
            <div className="border border-[#D95F39]/20 bg-[#D95F39]/5 p-6 flex items-center gap-4 text-[#D95F39] text-xs font-black uppercase tracking-widest">
              <AlertCircle size={18} /> {err}
            </div>
          )}

          {!item ? (
            <div className="h-[50vh] flex flex-col items-center justify-center text-[#1A3C34]/20 space-y-6">
               <Info size={48} strokeWidth={1} />
               <p className="font-serif italic text-xl">The requested exhibit is unavailable.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
 
              <div className="lg:col-span-8 space-y-10">
                <div className="relative group">
                  <div className="absolute -inset-4 bg-[#1A3C34]/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                  <div className="relative bg-black border border-[#1A3C34]/10 shadow-2xl">
                    <video
                      src={item.fullVideoUrl ?? item.previewVideoUrl}
                      controls
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full aspect-video object-contain"
                    />
                  </div>
                </div>

                <div className="space-y-6 border-b border-[#1A3C34]/10 pb-10">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[#D95F39] text-[10px] font-black uppercase tracking-[0.3em] mb-2">
                      <Sparkles size={12} /> Curated Masterpiece
                    </div>
                    <h1 className="text-5xl md:text-7xl font-serif italic tracking-tight text-[#1A3C34]">
                      {item.title ?? `Archive Asset #${String(item.id).slice(-4)}`}
                    </h1>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-[#1A3C34]/40 text-[11px] font-bold uppercase tracking-widest">
                    <span>Recorded: {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : "-"}</span>
                    <span className="w-1 h-1 rounded-full bg-[#1A3C34]/10" />
                    <span className="text-[#1A3C34]">Spatial Reconstruction Alpha</span>
                  </div>
                </div>
              </div>

  
              <div className="lg:col-span-4 space-y-10">
                
      
                <div className="bg-white border border-[#1A3C34]/10 p-10 space-y-8">
                  <div className="space-y-2">
                    <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-[#1A3C34] flex items-center gap-2">
                      <Share2 size={16} /> Share Experience
                    </h3>
                    <p className="text-[#1A3C34]/40 text-[13px] font-medium leading-relaxed">
                      Invite others to explore this digital twin.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-[#F2F0EB] p-4 text-[10px] font-mono text-[#1A3C34]/60 break-all border border-[#1A3C34]/5">
                      {shareUrl}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        className={`flex-1 rounded-none h-14 font-bold text-[11px] uppercase tracking-widest transition-all ${
                          copied ? "bg-[#D95F39] text-white" : "bg-[#1A3C34] text-[#F2F0EB] hover:bg-[#D95F39]"
                        }`} 
                        onClick={copyShare}
                      >
                        {copied ? (
                          <span className="flex items-center gap-2 animate-in fade-in">
                            <CheckCircle2 size={14} /> Link Copied
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Copy size={14} /> Copy Identity Link
                          </span>
                        )}
                      </Button>
                      <button
                        className="w-14 h-14 flex items-center justify-center border border-[#1A3C34]/10 hover:bg-[#1A3C34] hover:text-[#F2F0EB] transition-all"
                        onClick={() => window.open(shareUrl, "_blank")}
                      >
                        <ExternalLink size={18} />
                      </button>
                    </div>
                  </div>
                </div>

   
                <div className="space-y-6">
                  <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-[#1A3C34] flex items-center gap-2 pl-2">
                    <Info size={16} /> Asset Intelligence
                  </h3>
                  <div className="bg-white border border-[#1A3C34]/10 overflow-hidden">
                    <MetaRow label="Identity ID" value={String(item.id)} />
                    <MetaRow label="Origin Date" value={item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"} />
                    <div className="flex justify-between items-center p-6 border-b border-[#1A3C34]/5">
                      <span className="text-[10px] font-bold text-[#1A3C34]/30 uppercase tracking-widest">Verification</span>
                      <Badge className="bg-[#1A3C34]/5 text-[#1A3C34] border-none font-bold text-[9px] tracking-widest uppercase rounded-none px-2 py-1">
                        Authentic Scan
                      </Badge>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center p-6 border-b border-[#1A3C34]/5">
      <span className="text-[10px] font-bold text-[#1A3C34]/30 uppercase tracking-widest">{label}</span>
      <span className="text-[12px] font-bold text-[#1A3C34]">{value}</span>
    </div>
  );
}