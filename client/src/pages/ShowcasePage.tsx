import { useCallback, useEffect, useState } from "react";
import Layout from "../components/Layout";
import { Badge } from "../components/ui/badge";
import { getPublicPosts, type PublicPost } from "../api/public";
import { RefreshCw, AlertCircle, Sparkles, Plus, CalendarDays, Download, Heart, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PAGE_SIZE = 6;

export default function ShowcasePage() {
  const [posts, setPosts] = useState<PublicPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const nav = useNavigate();

  const load = useCallback(async (nextPage: number) => {
    setErr("");
    setLoading(true);
    try {
      const res = await getPublicPosts(nextPage, PAGE_SIZE);
      setPosts(Array.isArray(res.posts) ? res.posts : []);
      setPage(Math.max(1, Number(res.page) || nextPage));
      setTotalPages(Math.max(1, Number(res.totalPages) || 1));
      setTotalCount(Math.max(0, Number(res.totalCount) || 0));
      setHasNext(Boolean(res.hasNext));
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(page);
  }, [load, page]);

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
                  Public <span className="font-sans not-italic font-black text-[#1A3C34] uppercase">Showcase</span>
                </h1>
                <p className="text-[#1A3C34]/40 font-bold text-[12px] uppercase tracking-[0.3em] flex items-center gap-3 mt-4">
                  <Sparkles size={14} className="text-[#D95F39]" /> 공개된 3D 게시물을 페이지 단위로 탐색합니다
                </p>
              </div>
            </div>

            <button
              onClick={() => void load(page)}
              disabled={loading}
              className="group flex items-center gap-3 border border-[#1A3C34]/20 px-6 py-4 text-[10px] font-black text-[#1A3C34] uppercase tracking-[0.2em] hover:bg-[#1A3C34] hover:text-[#F2F0EB] transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`} />
              Update List
            </button>
          </div>

          <div className="flex flex-col gap-3 rounded-3xl border border-[#1A3C34]/10 bg-white/60 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-[#1A3C34]/45">Showcase Feed</div>
              <div className="text-[14px] font-bold text-[#1A3C34]">
                총 {totalCount.toLocaleString("ko-KR")}개의 공개 게시물
              </div>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.18em]">
              <span className="rounded-full border border-[#1A3C34]/10 bg-white px-4 py-2 text-[#1A3C34]/60">
                Page {page} / {totalPages}
              </span>
              <span className="rounded-full border border-[#D95F39]/15 bg-[#D95F39]/8 px-4 py-2 text-[#D95F39]">
                Latest First
              </span>
            </div>
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
          ) : posts.length === 0 ? (
            <div className="h-96 flex flex-col items-center justify-center text-[#1A3C34]/20 border border-dashed border-[#1A3C34]/10">
              <p className="font-serif italic text-xl">The gallery is currently empty.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
              {posts.map((post) => (
                <div
                  key={String(post.id)}
                  onClick={() => nav(`/showcase/${encodeURIComponent(String(post.postId))}/viewer`)}
                  className="group cursor-pointer"
                >

                  <div className="relative aspect-[4/5] bg-[#1A3C34] overflow-hidden shadow-2xl">
                    <PreviewVideo
                      poster={post.thumbnailUrl ?? undefined}
                    />

                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_30%),linear-gradient(180deg,_rgba(26,60,52,0.1)_0%,_rgba(26,60,52,0.82)_70%,_rgba(7,12,10,0.98)_100%)] group-hover:opacity-90 transition-opacity duration-700" />
                    <div className="absolute top-6 right-6 w-10 h-10 bg-white flex items-center justify-center text-[#1A3C34] translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                      <Plus size={20} />
                    </div>

                    <div className="absolute inset-x-0 bottom-0 p-8 pt-24">
                      <div className="text-[10px] text-[#D95F39] font-black uppercase tracking-[0.3em] mb-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500 delay-100">
                        Open Public Viewer
                      </div>
                      <h3 className="text-white font-black tracking-tight text-2xl uppercase leading-none mb-1">
                        {post.title}
                      </h3>
                      <div className="mt-4 space-y-3 text-white/75">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em]">
                          <UserRound size={13} className="text-[#FFB8A4]" />
                          {post.authorName ?? "Unknown Author"}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em]">
                          <CalendarDays size={13} className="text-[#FFB8A4]" />
                          {post.createdAt
                            ? new Date(post.createdAt).toLocaleDateString("ko-KR", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "-"}
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/65">
                          <span className="inline-flex items-center gap-1.5">
                            <Heart size={13} className="text-[#FFB8A4]" />
                            {post.likeCount.toLocaleString("ko-KR")}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Download size={13} className="text-[#FFB8A4]" />
                            {post.downloadCount.toLocaleString("ko-KR")}
                          </span>
                        </div>
                        {(post.sceneId != null || post.jobId != null) && (
                          <p className="pt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">
                            {post.sceneId != null ? `Scene ${post.sceneId}` : "Scene -"} / {post.jobId != null ? `Job ${post.jobId}` : "Job -"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-4 border-t border-[#1A3C34]/10 pt-8">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={loading || page <= 1}
              className="h-12 px-5 border border-[#1A3C34]/15 text-[10px] font-black uppercase tracking-[0.2em] text-[#1A3C34] hover:bg-[#1A3C34] hover:text-[#F2F0EB] transition-colors disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#1A3C34]"
            >
              Previous
            </button>
            <div className="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-[#1A3C34]/45">
              Page {page} of {totalPages}
            </div>
            <button
              type="button"
              onClick={() => setPage((current) => (hasNext ? current + 1 : current))}
              disabled={loading || !hasNext}
              className="h-12 px-5 border border-[#1A3C34]/15 text-[10px] font-black uppercase tracking-[0.2em] text-[#1A3C34] hover:bg-[#1A3C34] hover:text-[#F2F0EB] transition-colors disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#1A3C34]"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function PreviewVideo({
  poster,
}: {
  poster?: string;
}) {
  return (
    <div className="relative h-full w-full">
      {poster && (
        <img
          src={poster}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110"
          draggable={false}
        />
      )}

      {!poster && (
        <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.2),_transparent_28%),linear-gradient(160deg,_#1A3C34_0%,_#10251F_55%,_#08100D_100%)]">
          <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:34px_34px]" />
          <div className="absolute -right-10 top-8 h-28 w-28 rounded-full border border-white/15 bg-white/5" />
          <div className="absolute left-8 top-16 h-16 w-16 rounded-full border border-[#D95F39]/25 bg-[#D95F39]/10" />
          <div className="absolute bottom-10 left-10 text-white/35 text-[10px] font-black uppercase tracking-[0.24em]">
            Public Showcase
          </div>
        </div>
      )}
    </div>
  );
}
