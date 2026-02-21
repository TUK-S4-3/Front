import Layout from "../components/Layout";
import { Badge } from "../components/ui/badge";
import { Scale, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";

export default function TermsPage() {
  return (
    <Layout>
      <div className="bg-[#F8FAFC] min-h-screen px-6 pt-28 pb-20 relative text-[#1E293B]">

        <div className="pointer-events-none absolute top-0 right-0 w-1/2 h-[520px] bg-white/60 skew-x-12 -mr-24 opacity-60" />

        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-[-14%] right-[-14%] h-[640px] w-[640px] rounded-full bg-[#0055FF]/10 blur-[140px]" />
          <div className="absolute bottom-[-16%] left-[-16%] h-[560px] w-[560px] rounded-full bg-slate-900/5 blur-[140px]" />
        </div>

        <div className="max-w-4xl mx-auto space-y-12 relative z-10">
 
          <div className="space-y-6 border-b border-slate-200 pb-10">
            <div className="flex items-center gap-4">
              <div className="bg-[#0F172A] text-white p-3 rounded-2xl shadow-xl shadow-slate-900/10">
                <Scale size={20} />
              </div>

              <div className="flex gap-2">
                <Badge
                  variant="outline"
                  className="border-slate-200 bg-white text-slate-700 font-black uppercase tracking-widest text-[9px] rounded-full px-3 py-1"
                >
                  Legal document
                </Badge>
                <Badge
                  variant="outline"
                  className="border-[#0055FF]/20 bg-[#0055FF]/5 text-[#0055FF] font-black uppercase tracking-widest text-[9px] rounded-full px-3 py-1"
                >
                  Beta v1.0
                </Badge>
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-black tracking-[-0.05em] leading-[1.02] text-slate-900">
              Terms of{" "}
              <span className="text-[#0055FF]">Service</span>
            </h1>

            <p className="text-slate-500 font-bold text-[12px] uppercase tracking-[0.25em] flex items-center gap-3">
              <Sparkles size={14} className="text-[#0055FF]" />
              스튜디오 베타 서비스 이용 지침서
            </p>
          </div>

    
          <div className="grid gap-8">
            <div className="grid md:grid-cols-5 gap-8">
              <div className="md:col-span-2">
                <h3 className="text-[20px] font-black tracking-tight text-slate-900 leading-tight">
                  Our commitment<br />& your responsibility
                </h3>
                <p className="mt-4 text-[13px] text-slate-600 font-medium leading-relaxed">
                  VoxMesh Studio는 3D 자산 생성을 지원합니다. 원활한 서비스 제공을 위해 아래
                  가이드라인을 준수해 주세요.
                </p>
              </div>

              <div className="md:col-span-3 space-y-4">
                <TermItem
                  title="콘텐츠 소유권"
                  desc="사용자는 업로드하는 모든 영상 콘텐츠에 대한 법적 권리를 보유해야 하며, 결과물에 대한 저작권은 원칙적으로 사용자에게 귀속됩니다."
                />
                <TermItem
                  title="이용 제한 사항"
                  desc="공공질서를 해치는 자료, 저작권 침해물, 타인의 개인정보가 포함된 데이터 업로드 시 서비스 이용이 제한될 수 있습니다."
                />
                <TermItem
                  title="베타 운영 정책"
                  desc="본 서비스는 베타 단계로 기능 및 정책 변경이 발생할 수 있으며, 주요 변경 사항은 사전 고지됩니다."
                />
                <TermItem
                  title="시스템 안정성"
                  desc="최적의 품질을 지향하나, 베타 기간 중 렌더링 지연이나 일시적인 접속 장애가 발생할 수 있습니다."
                />
              </div>
            </div>

  
            <div className="bg-[#0F172A] p-10 md:p-12 text-white relative overflow-hidden rounded-3xl border border-white/10">
              <div className="absolute top-0 right-0 w-72 h-72 bg-[#0055FF]/20 rounded-full blur-3xl -mr-36 -mt-36" />

              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-10 relative z-10">
                <div className="flex items-start gap-6">
                  <div className="w-14 h-14 bg-[#0055FF] rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xl shadow-[#0055FF]/20">
                    <ShieldCheck size={28} />
                  </div>
                  <div className="space-y-2">
                    <p className="font-black text-[16px] uppercase tracking-widest">
                      Data security & privacy
                    </p>
                    <p className="text-[13px] text-white/60 font-medium leading-relaxed max-w-md">
                      업로드된 데이터는 암호화 및 접근 제어 정책으로 보호됩니다. 허가되지 않은
                      제3자에게 노출되지 않도록 설계되어 있습니다.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="group flex items-center gap-3 whitespace-nowrap rounded-2xl bg-white text-[#0F172A] px-8 py-4 font-black text-[11px] uppercase tracking-[0.2em] hover:bg-[#0055FF] hover:text-white transition-all"
                >
                  Contact support{" "}
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>


          <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest pt-6">
            Last updated: February 2026 • VoxMesh Studio Legal Team
          </p>
        </div>
      </div>
    </Layout>
  );
}

function TermItem({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="group p-8 bg-white border border-slate-200 hover:border-[#0055FF]/40 transition-colors rounded-3xl shadow-xl shadow-slate-900/5">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 bg-[#0055FF] rounded-full" />
          <h4 className="font-black text-[13px] uppercase tracking-widest text-slate-900">
            {title}
          </h4>
        </div>
        <p className="text-[13px] text-slate-600 font-medium leading-relaxed pl-4 border-l border-slate-200 group-hover:border-[#0055FF]/40 transition-colors">
          {desc}
        </p>
      </div>
    </div>
  );
}