import Layout from "../components/Layout";
import { Badge } from "../components/ui/badge";
import { HelpCircle, BookOpen, Sparkles, ArrowUpRight } from "lucide-react";

export default function HelpCenterPage() {
  return (
    <Layout>

      <div className="bg-[#F2F0EB] min-h-screen px-6 pt-28 pb-20 relative text-[#2D2D2D]">
        
        <div className="max-w-4xl mx-auto space-y-12 relative z-10">
          

          <div className="space-y-6 border-b border-[#1A3C34]/10 pb-12">
            <div className="flex items-center gap-4">
              <div className="bg-[#D95F39] text-white p-3 shadow-lg">
                <HelpCircle size={20} />
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="border-[#1A3C34]/20 bg-white text-[#1A3C34] font-bold uppercase tracking-[0.2em] text-[9px] rounded-none px-3">
                  Support
                </Badge>
                <Badge variant="outline" className="border-[#1A3C34]/10 bg-transparent text-[#1A3C34]/40 font-bold uppercase tracking-[0.2em] text-[9px] rounded-none px-3">
                  Resources
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-6xl md:text-8xl font-serif italic tracking-tighter leading-none">
                Help <span className="font-sans not-italic font-black text-[#1A3C34] uppercase">Center</span>
              </h1>
              <p className="text-[#1A3C34]/40 font-bold text-[12px] uppercase tracking-[0.3em] flex items-center gap-3">
                <Sparkles size={14} className="text-[#D95F39]" /> 원활한 아카이브 생성을 위한 큐레이션 가이드
              </p>
            </div>
          </div>


          <div className="grid gap-12">
            <section className="space-y-8">
              <div className="flex items-center gap-4">
                <BookOpen size={18} className="text-[#1A3C34]" />
                <h2 className="text-[14px] font-black uppercase tracking-[0.3em] text-[#1A3C34]">Frequently Asked</h2>
              </div>

              <div className="divide-y divide-[#1A3C34]/10 border-t border-[#1A3C34]/10">
                <FAQItem 
                  q="어떤 형식의 영상을 업로드해야 하나요?" 
                  a="최적의 3D 복원을 위해 MP4 또는 MOV 형식을 권장하며, 피사체를 중심으로 360도 천천히 회전하며 촬영한 영상이 가장 좋은 결과물을 만듭니다."
                />
                <FAQItem 
                  q="재구축(Reconstruction) 시간은 얼마나 소요되나요?" 
                  a="영상 길이에 따라 다르지만, 평균적으로 5분 내외가 소요됩니다. 현재 베타 단계에서는 서버 부하에 따라 조금 더 지연될 수 있습니다."
                />
                <FAQItem 
                  q="생성된 디지털 자산의 보관 기간은 어떻게 되나요?" 
                  a="생성된 아카이브는 기본적으로 30일 동안 안전하게 보관됩니다. 영구 보관이 필요하신 경우 마스터 파일을 미리 다운로드해 두시기 바랍니다."
                />
                <FAQItem 
                  q="전문가용 소프트웨어와 호환되나요?" 
                  a="네, VoxMesh Studio에서 생성된 결과물은 Blender, Unreal Engine, Unity 등 표준 3D 툴에서 즉시 사용 가능한 표준 포맷을 지향합니다."
                />
              </div>
            </section>

     
            <div className="bg-[#1A3C34] p-12 text-[#F2F0EB] relative overflow-hidden">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                <div className="space-y-3 text-center md:text-left">
                  <h3 className="text-[20px] font-black uppercase tracking-tight">Still Need Assistance?</h3>
                  <p className="text-[13px] text-[#F2F0EB]/50 font-medium leading-relaxed">
                    추가적인 기술 지원이나 비즈니스 파트너십 문의는 <br className="hidden md:block" />
                    컨택 센터를 통해 24시간 이내에 답변 드립니다.
                  </p>
                </div>
                
                <button className="flex items-center gap-3 bg-[#D95F39] text-[#F2F0EB] px-10 py-5 font-bold text-[12px] uppercase tracking-[0.2em] hover:brightness-110 transition-all shadow-xl">
                  Contact Us <ArrowUpRight size={16} />
                </button>
              </div>
            </div>
          </div>

          <p className="text-center text-[10px] text-[#1A3C34]/20 font-bold uppercase tracking-widest">
            © 2026 VOXMESH STUDIO • Support System
          </p>
        </div>
      </div>
    </Layout>
  );
}

function FAQItem({ q, a }: { q: string, a: string }) {
  return (
    <div className="py-10 group cursor-default">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/3">
          <h4 className="text-[15px] font-black text-[#1A3C34] leading-tight group-hover:text-[#D95F39] transition-colors">
            Q. {q}
          </h4>
        </div>
        <div className="md:w-2/3">
          <p className="text-[14px] text-[#1A3C34]/50 font-medium leading-relaxed">
            {a}
          </p>
        </div>
      </div>
    </div>
  );
}
