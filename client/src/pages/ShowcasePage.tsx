import { useEffect, useRef, useState } from "react";
import Layout from "../components/Layout";
import { Badge } from "../components/ui/badge";
import { getPublicGallery, type PublicGalleryItem } from "../api/public";
import { RefreshCw, AlertCircle, Sparkles, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ShowcasePage() {
  const [items, setItems] = useState<PublicGalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const nav = useNavigate();

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const res = await getPublicGallery();
      setItems(Array.isArray(res.items) ? res.items : []);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <Layout>

      <div className="bg-[#F2F0EB] min-h-screen px-6 pt-28 pb-20 text-[#2D2D2D]">
        <div className="max-w-7xl mx-auto space-y-16">
          

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-[#1A3C34]/10 pb-4">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="border-[#1A3C34]/20 bg-white text-[#1A3C34] font-bold uppercase tracking-widest text-[9px] rounded-none px-3 py-1">
                  Exhibition
                </Badge>
                <Badge variant="outline" className="border-[#D95F39]/20 bg-transparent text-[#D95F39] font-bold uppercase tracking-widest text-[9px] rounded-none px-3 py-1">
                  Public Archive
                </Badge>
              </div>
              <div className="space-y-2">
                <h1 className="text-6xl md:text-8xl font-serif italic tracking-tighter leading-none">
                  The <span className="font-sans not-italic font-black text-[#1A3C34] uppercase">Gallery</span>
                </h1>
                <p className="text-[#1A3C34]/40 font-bold text-[12px] uppercase tracking-[0.3em] flex items-center gap-3 mt-4">
                  <Sparkles size={14} className="text-[#D95F39]" /> 스튜디오에서 탄생한 최신 3D 아카이브
                </p>
              </div>
            </div>

            <button
              onClick={load}
              disabled={loading}
              className="group flex items-center gap-3 border border-[#1A3C34]/20 px-6 py-4 text-[10px] font-black text-[#1A3C34] uppercase tracking-[0.2em] hover:bg-[#1A3C34] hover:text-[#F2F0EB] transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`} />
              Update List
            </button>
          </div>

          {err && (
            <div className="border border-[#D95F39]/20 bg-[#D95F39]/5 p-6 flex items-center gap-4 text-[#D95F39] text-xs font-black uppercase tracking-widest">
              <AlertCircle size={18} /> {err}
            </div>
          )}

          {loading ? (
            <div className="h-96 flex flex-col items-center justify-center gap-4 text-[#1A3C34]/30">
              <RefreshCw className="h-8 w-8 animate-spin" strokeWidth={1} />
              <p className="text-[10px] font-bold uppercase tracking-[0.4em]">Arranging Artifacts...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="h-96 flex flex-col items-center justify-center text-[#1A3C34]/20 border border-dashed border-[#1A3C34]/10">
              <p className="font-serif italic text-xl">The gallery is currently empty.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
              {items.map((item) => (
                <div 
                  key={String(item.id)} 
                  onClick={() => nav(`/showcase/${item.id}`)}
                  className="group cursor-pointer"
                >

                  <div className="relative aspect-[4/5] bg-[#1A3C34] overflow-hidden shadow-2xl">
                    <PreviewVideo
                      src={item.previewVideoUrl}
                      poster={(item as any).posterUrl}
                      maxPlayMs={2500}
                    />
                    
            
                    <div className="absolute inset-0 bg-[#1A3C34]/20 group-hover:bg-transparent transition-colors duration-700" />
                    
           
                    <div className="absolute top-6 right-6 w-10 h-10 bg-white flex items-center justify-center text-[#1A3C34] translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                      <Plus size={20} />
                    </div>

                    <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-[#1A3C34] to-transparent pt-20">
                      <div className="text-[10px] text-[#D95F39] font-black uppercase tracking-[0.3em] mb-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500 delay-100">
                        View Archive
                      </div>
                      <h3 className="text-white font-black tracking-tight text-2xl uppercase leading-none mb-1">
                        {item.title ?? `Scan Asset #${String(item.id).slice(-4)}`}
                      </h3>
                      <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : `SERIAL NO. ${item.id}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function PreviewVideo({
  src,
  poster,
  maxPlayMs, 
}: {
  src: string;
  poster?: string;
  maxPlayMs?: number;
}) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [ready, setReady] = useState(false);
  const timerRef = useRef<number | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const play = async () => {
    const v = ref.current;
    if (!v) return;
    try {
      v.muted = true;
      v.playsInline = true;
      await v.play();
      clearTimer();
      if (maxPlayMs) {
        timerRef.current = window.setTimeout(() => {
          pause();
        }, maxPlayMs);
      }
    } catch {}
  };

  const pause = () => {
    const v = ref.current;
    if (!v) return;
    clearTimer();
    v.pause();
    v.currentTime = 0;
  };

  const toggle = async () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) await play();
    else pause();
  };

  useEffect(() => () => clearTimer(), []);

  return (
    <div
      className="relative h-full w-full"
      onMouseEnter={play}
      onMouseLeave={pause}
      onTouchStart={toggle}
    >
      <video
        ref={ref}
        src={src}
        poster={poster}
        loop
        muted
        playsInline
        preload="metadata"
        className={`w-full h-full object-cover transition-transform duration-[2000ms] ease-out group-hover:scale-110 ${
          ready ? "opacity-100" : "opacity-0"
        }`}
        onCanPlay={() => setReady(true)}
      />

      {!ready && poster && (
        <img
          src={poster}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110"
          draggable={false}
        />
      )}
    </div>
  );
}
