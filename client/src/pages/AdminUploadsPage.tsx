import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminUploads, adminUploadResult } from "../api/admin";
import type { Upload } from "../api/types";
import Layout from "../components/Layout";

import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Settings2,
  CheckCircle,
  AlertCircle,
  Database,
  Terminal,
  Activity
} from "lucide-react";

export default function AdminUploadsPage() {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const nav = useNavigate();

  async function refresh() {
    setErr("");
    setLoading(true);
    try {
      const res = await adminUploads();
      setUploads(Array.isArray(res.uploads) ? res.uploads : []);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const handleSetResult = async (id: number) => {
    try {
      setErr("");
      await adminUploadResult(id, "mock/result.glb");
      await refresh();
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    }
  };

  return (
    <Layout>
      <div className="bg-[#F2F0EB] min-h-screen pt-28 pb-20 px-6 font-sans text-[#1A3C34]">
        <div className="max-w-6xl mx-auto space-y-8">

  
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex items-start gap-6">
              <div className="h-16 w-16 rounded-none bg-[#1A3C34] flex items-center justify-center shadow-xl shadow-[#1A3C34]/20">
                <ShieldCheck className="h-8 w-8 text-white" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-4">
                  <h1 className="text-5xl font-black uppercase tracking-tighter">
                    Control <span className="font-serif italic font-light lowercase text-[#D95F39]">Panel</span>
                  </h1>
                  <Badge className="rounded-none bg-[#D95F39] text-white font-black px-3 py-1 text-[10px] tracking-[0.2em] border-none">
                    ADMIN
                  </Badge>
                </div>
                <p className="text-[#1A3C34]/60 font-bold text-[13px] uppercase tracking-widest">
                  Video To Scene Pipeline Management & Archiving
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={refresh}
              disabled={loading}
              className="rounded-none border-2 border-[#1A3C34] text-[#1A3C34] hover:bg-[#1A3C34] hover:text-white transition-all px-8 h-14 font-black uppercase tracking-widest text-xs"
            >
              <RefreshCw className={`h-4 w-4 mr-3 ${loading ? "animate-spin" : ""}`} />
              Sync Node
            </Button>
          </div>

          {err && (
            <div className="rounded-none border-l-4 border-[#D95F39] bg-[#D95F39]/10 p-5 flex items-center gap-4 text-[#D95F39] animate-in fade-in">
              <AlertCircle className="h-5 w-5" />
              <span className="text-xs font-black uppercase tracking-widest">{err}</span>
            </div>
          )}

  
          <Card className="border-none shadow-[0_40px_80px_-15px_rgba(26,60,52,0.1)] rounded-none bg-white overflow-hidden">
            <CardHeader className="border-b border-[#F2F0EB] p-10 bg-white">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-black uppercase tracking-tight">
                    Archive Registry
                  </CardTitle>
                  <CardDescription className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1A3C34]/30">
                    Total {uploads.length} system entries indexed
                  </CardDescription>
                </div>

                <div className="bg-[#F2F0EB] rounded-none px-5 py-2.5 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#1A3C34]">
                  <Activity size={14} className="text-[#D95F39] animate-pulse" />
                  System Status: Operational
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-[#1A3C34]">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="px-10 py-5 font-black text-white/50 text-[10px] uppercase tracking-[0.25em]">ID / Project</TableHead>
                    <TableHead className="font-black text-white/50 text-[10px] uppercase tracking-[0.25em]">Registry Status</TableHead>
                    <TableHead className="font-black text-white/50 text-[10px] uppercase tracking-[0.25em]">Generated At</TableHead>
                    <TableHead className="text-right px-10 font-black text-white/50 text-[10px] uppercase tracking-[0.25em]">Execution</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {uploads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-80 text-center text-[#1A3C34]/20 font-black uppercase text-[11px] tracking-[0.4em]">
                        <Database className="mx-auto h-12 w-12 mb-6 opacity-10" />
                        Zero Records in Vault
                      </TableCell>
                    </TableRow>
                  ) : (
                    uploads.map((u) => (
                      <TableRow
                        key={u.id}
                        className="group hover:bg-[#F2F0EB]/30 transition-colors border-b border-[#F2F0EB] last:border-none"
                      >
                        <TableCell className="px-10 py-7">
                          <button
                            className="flex items-center gap-3 font-black text-[#1A3C34] hover:text-[#D95F39] transition-colors text-sm uppercase"
                            onClick={() => nav(`/uploads/${u.id}`)}
                          >
                            <span className="bg-[#F2F0EB] px-3 py-1 text-[10px] font-mono tracking-tighter">
                              {String(u.id).padStart(4, '0')}
                            </span>
                            <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-all" />
                          </button>
                        </TableCell>

                        <TableCell>
                          <AdminStatusBadge status={u.status} />
                        </TableCell>

                        <TableCell className="text-[#1A3C34]/60 text-[12px] font-bold uppercase tracking-tight">
                          {new Date(u.createdAt).toLocaleDateString()}
                          <span className="ml-3 text-[#1A3C34]/30 font-medium">
                            {new Date(u.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </TableCell>

                        <TableCell className="text-right px-10">
                          <Button
                            size="sm"
                            className="h-11 rounded-none gap-3 bg-[#1A3C34] text-white hover:bg-[#D95F39] transition-all shadow-none font-black text-[10px] uppercase tracking-widest px-6"
                            disabled={u.status === "COMPLETED"}
                            onClick={() => handleSetResult(u.id)}
                          >
                            <CheckCircle size={14} />
                            Force Result
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white border-2 border-[#1A3C34]/5 p-8 rounded-none flex items-start gap-6 shadow-sm">
              <div className="h-14 w-14 rounded-none bg-[#F2F0EB] flex items-center justify-center shrink-0">
                <Terminal className="h-6 w-6 text-[#1A3C34]" />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-[#D95F39] uppercase tracking-[0.3em]">Manual Overhaul</p>
                <p className="text-lg font-black uppercase tracking-tight">파이프라인 수동 제어</p>
                <p className="text-[13px] text-[#1A3C34]/60 font-medium leading-relaxed">
                  자동 재구성이 지연될 경우 'Force Result'를 통해 강제 완료 처리가 가능합니다. 이 작업은 즉시 데이터베이스에 반영되며 복구가 불가능합니다.
                </p>
              </div>
            </div>

            <div className="bg-[#1A3C34] p-8 rounded-none flex items-start gap-6 shadow-xl shadow-[#1A3C34]/10 text-white">
              <div className="h-14 w-14 rounded-none bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/10">
                <Settings2 className="h-6 w-6 text-white" />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Access Protocol</p>
                <p className="text-lg font-black uppercase tracking-tight text-white">보안 및 모니터링</p>
                <p className="text-[13px] text-white/50 font-medium leading-relaxed">
                  모든 관리자 로그는 블록체인 기반 아카이브에 기록됩니다. 권한 없는 접근 시도는 자동으로 차단되며 보안 담당자에게 즉시 통보됩니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function AdminStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    COMPLETED: "bg-emerald-500 text-white border-none shadow-sm",
    FAILED: "bg-[#D95F39] text-white border-none shadow-sm",
    PROCESSING: "bg-[#1A3C34] text-white border-none animate-pulse",
    PENDING: "bg-[#F2F0EB] text-[#1A3C34]/40 border-none",
  };

  return (
    <Badge
      className={`font-black text-[9px] px-3 py-1.5 rounded-none uppercase tracking-widest ${
        styles[status] || styles.PENDING
      }`}
    >
      {status === "PROCESSING" && <RefreshCw size={10} className="mr-2 animate-spin" />}
      {status}
    </Badge>
  );
}
