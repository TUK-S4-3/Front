import Layout from "../components/Layout";
import { Badge } from "../components/ui/badge";
import { Coins, HardDrive, ShieldAlert, Sparkles, Scale, Info } from "lucide-react";

export default function ProductPage() {
  return (
    <Layout>

      <div className="bg-[#F2F0EB] min-h-screen pt-28 pb-20 px-6 text-[#2D2D2D]">
        <div className="max-w-6xl mx-auto space-y-20">
          

          <div className="space-y-6 border-b border-[#1A3C34]/10 pb-10 relative">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="border-[#1A3C34]/20 bg-white text-[#1A3C34] font-bold uppercase tracking-widest text-[9px] rounded-none px-3 py-1">
                Legal & Policy
              </Badge>
              <Badge variant="outline" className="border-[#D95F39]/20 bg-transparent text-[#D95F39] font-bold uppercase tracking-widest text-[9px] rounded-none px-3 py-1">
                Product v1.0
              </Badge>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-6xl md:text-8xl font-serif italic tracking-tighter leading-none">
                Terms <span className="font-sans not-italic font-black text-[#1A3C34] uppercase text-5xl md:text-7xl">&</span> Value
              </h1>
              <p className="text-[#1A3C34]/60 font-medium max-w-2xl text-lg leading-relaxed">
                사용자의 창의성을 보호하고 기술의 공정한 가치를 나누기 위한 Video To Scene의 약속입니다.
                <span className="block mt-2 italic text-[#1A3C34]/30 font-serif text-base font-normal">
                  Our principles are designed to ensure a sustainable 3D scanning ecosystem for all creators.
                </span>
              </p>
            </div>


            <Scale className="absolute top-0 right-0 h-48 w-48 text-[#1A3C34]/[0.03] -z-10" strokeWidth={1} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PolicyCardVox
              icon={<Coins className="text-[#D95F39]" size={20} />}
              title="Credits"
              tag="Billing System"
              items={[
                "가입 시 웰컴 +30 크레딧 즉시 지급",
                "스캔 분석 1회당 소요 크레딧(추후 공지)",
                "크레딧 유효기간: 지급일로부터 365일",
                "유료 결제 시스템 정식 업데이트 예정",
              ]}
            />
            <PolicyCardVox
              icon={<HardDrive className="text-[#1A3C34]" size={20} />}
              title="Storage"
              tag="Data Management"
              items={[
                "생성된 3D 파일 보관 기간: 30일",
                "기간 만료 시 클라우드 데이터 영구 삭제",
                "민감정보 포함 데이터 업로드 절대 금지",
                "중요 에셋은 생성 직후 로컬 저장 권장",
              ]}
            />
            <PolicyCardVox
              icon={<ShieldAlert className="text-[#D95F39]" size={20} />}
              title="Usage"
              tag="Ownership & Rights"
              items={[
                "원본 영상에 대한 저작권 및 권한 소유 필수",
                "불법적 목적의 3D 복제 및 업로드 금지",
                "비식별 데이터는 AI 성능 개선에 활용 가능",
                "정책 위반 시 서비스 이용이 영구 제한됨",
              ]}
            />
          </div>

   
          <section className="bg-[#1A3C34] text-[#F2F0EB] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none" />
            <div className="relative z-10 p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="space-y-6 max-w-xl text-center md:text-left">
                <div className="flex justify-center md:justify-start items-center gap-3">
                  <div className="p-3 bg-[#D95F39] text-white">
                    <Sparkles size={24} />
                  </div>
                  <h2 className="text-3xl font-black uppercase tracking-tight">Beta Service Notice</h2>
                </div>
                <p className="text-[#F2F0EB]/60 text-[15px] leading-relaxed font-medium">
                  현재 Video To Scene는 베타 단계로 운영 중입니다. 사용자 피드백을 수렴하여 
                  <span className="text-[#F2F0EB]"> 크레딧 요금 최적화, 보관 기간 확장, 고성능 엔진 업그레이드</span> 
                  등 더 진보된 운영 정책을 마련하고 있습니다. 여러분의 소중한 의견이 서비스의 기준이 됩니다.
                </p>
              </div>
              <div className="shrink-0 group-hover:rotate-12 transition-transform duration-700">
                <div className="border border-[#F2F0EB]/20 p-8 flex flex-col items-center gap-2">
                  <Info size={32} className="text-[#D95F39] mb-2" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-40">Operational Status</span>
                  <span className="text-lg font-serif italic">Alpha to Beta Transition</span>
                </div>
              </div>
            </div>
          </section>


          <div className="flex justify-center items-center gap-6 pt-10">
            <div className="h-px w-12 bg-[#1A3C34]/10" />
            <p className="text-[10px] text-[#1A3C34]/30 font-bold uppercase tracking-[0.5em]">Global Standard Compliance</p>
            <div className="h-px w-12 bg-[#1A3C34]/10" />
          </div>
        </div>
      </div>
    </Layout>
  );
}

function PolicyCardVox({
  icon,
  title,
  tag,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  tag: string;
  items: string[];
}) {
  return (
    <div className="bg-white border border-[#1A3C34]/10 p-10 space-y-8 hover:border-[#D95F39]/30 transition-all duration-500 group">
      <div className="space-y-4">
        <div className="h-14 w-14 border border-[#1A3C34]/5 flex items-center justify-center bg-[#F2F0EB]/50 group-hover:bg-[#1A3C34] group-hover:text-white transition-colors duration-500">
          {icon}
        </div>
        <div>
          <h3 className="text-2xl font-black uppercase tracking-tight text-[#1A3C34] mb-1">
            {title}
          </h3>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#D95F39]">
            {tag}
          </span>
        </div>
      </div>
      
      <div className="space-y-5">
        {items.map((t, i) => (
          <div key={i} className="flex gap-4 group/item">
            <div className="mt-1.5 h-1.5 w-1.5 bg-[#1A3C34]/20 group-hover/item:bg-[#D95F39] transition-colors" />
            <span className="text-[13px] text-[#1A3C34]/60 font-medium leading-tight group-hover/item:text-[#1A3C34] transition-colors">
              {t}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
