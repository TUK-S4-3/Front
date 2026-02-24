import Layout from "../components/Layout";
import { Badge } from "../components/ui/badge";
import { Scale, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";

export default function TermsPage() {
  return (
    <Layout>
 
      <div className="bg-[#F2F0EB] min-h-screen px-6 pt-28 pb-20 relative text-[#2D2D2D]">

        <div className="absolute top-0 right-0 w-1/2 h-[500px] bg-white/30 skew-x-12 -mr-20 pointer-events-none" />
        
        <div className="max-w-4xl mx-auto space-y-12 relative z-10">
          

          <div className="space-y-6 border-b border-[#1A3C34]/10 pb-12">
            <div className="flex items-center gap-4">
              <div className="bg-[#1A3C34] text-[#F2F0EB] p-3 shadow-xl">
                <Scale size={20} />
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="border-[#1A3C34]/20 bg-white text-[#1A3C34] font-bold uppercase tracking-widest text-[9px] rounded-none px-3">
                  Legal Document
                </Badge>
                <Badge variant="outline" className="border-[#1A3C34]/10 bg-transparent text-[#1A3C34]/40 font-bold uppercase tracking-widest text-[9px] rounded-none px-3">
                  Beta v1.0
                </Badge>
              </div>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-serif italic tracking-tighter leading-none">
              Terms of <span className="font-sans not-italic font-black text-[#1A3C34] uppercase block md:inline">Service</span>
            </h1>
            <p className="text-[#1A3C34]/40 font-bold text-[12px] uppercase tracking-[0.3em] flex items-center gap-3">
              <Sparkles size={14} className="text-[#D95F39]" /> 스튜디오 베타 서비스 이용 지침서
            </p>
          </div>

          <div className="grid gap-8">
            <div className="grid md:grid-cols-5 gap-8">
              <div className="md:col-span-2">
                <h3 className="text-[20px] font-black uppercase tracking-tighter text-[#1A3C34] leading-tight">
                  Our Commitment <br />& Your Responsibility
                </h3>
                <p className="mt-4 text-[13px] text-[#1A3C34]/50 font-medium leading-relaxed">
                  VoxMesh Studio는 혁신적인 3D 자산 생성을 지원합니다. 원활한 서비스 제공을 위해 아래의 가이드라인을 준수해 주시기 바랍니다.
                </p>
              </div>

              <div className="md:col-span-3 space-y-4">
                <TermItem 
                  title="콘텐츠 소유권" 
                  desc="사용자는 업로드하는 모든 영상 콘텐츠에 대한 법적 권리를 보유해야 하며, 결과물에 대한 저작권은 원칙적으로 사용자에게 귀속됩니다." 
                />
                <TermItem 
                  title="이용 제한 사항" 
                  desc="공공질서를 해치는 자료, 저작권 침해물, 타인의 개인정보가 포함된 데이터 업로드 시 서비스 이용이 즉시 제한될 수 있습니다." 
                />
                <TermItem 
                  title="베타 운영 정책" 
                  desc="본 서비스는 현재 베타 단계로, 기능 고도화 및 정책 변경이 수시로 발생할 수 있으며 주요 변경 사항은 사전 고지됩니다." 
                />
                <TermItem 
                  title="시스템 안정성" 
                  desc="최적의 품질을 지향하나, 베타 기간 중 예상치 못한 렌더링 지연이나 일시적인 접속 장애가 발생할 수 있음을 안내드립니다." 
                />
              </div>
            </div>


            <div className="bg-[#1A3C34] p-12 text-[#F2F0EB] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#D95F39]/10 rounded-full blur-3xl -mr-32 -mt-32 transition-transform group-hover:scale-110 duration-1000" />
              
              <div className="flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
                <div className="flex items-start gap-6">
                  <div className="w-14 h-14 bg-[#D95F39] flex items-center justify-center text-white shrink-0">
                    <ShieldCheck size={28} />
                  </div>
                  <div className="space-y-2">
                    <p className="font-black text-[18px] uppercase tracking-tight text-[#F2F0EB]">Data Security & Privacy</p>
                    <p className="text-[13px] text-[#F2F0EB]/50 font-medium leading-relaxed max-w-md">
                      업로드된 모든 데이터는 하이엔드 암호화 기술을 통해 보호되며, 
                      허가되지 않은 제3자에게 절대 노출되지 않습니다.
                    </p>
                  </div>
                </div>
                
                <button className="group flex items-center gap-3 whitespace-nowrap bg-transparent border border-[#F2F0EB]/30 text-[#F2F0EB] px-8 py-4 font-bold text-[11px] uppercase tracking-[0.2em] hover:bg-[#F2F0EB] hover:text-[#1A3C34] transition-all">
                  Contact Support <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>

   
          <p className="text-center text-[10px] text-[#1A3C34]/20 font-bold uppercase tracking-widest pt-10">
            Last Updated: February 2026 • VoxMesh Studio Legal Team
          </p>
        </div>
      </div>
    </Layout>
  );
}

function TermItem({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="group p-8 bg-white border border-[#1A3C34]/5 hover:border-[#1A3C34] transition-all">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 bg-[#D95F39]" />
          <h4 className="font-black text-[14px] uppercase tracking-widest text-[#1A3C34]">{title}</h4>
        </div>
        <p className="text-[13px] text-[#1A3C34]/50 font-medium leading-relaxed pl-4 border-l border-[#1A3C34]/10 group-hover:border-[#D95F39] transition-colors">
          {desc}
        </p>
      </div>
    </div>
  );
}
