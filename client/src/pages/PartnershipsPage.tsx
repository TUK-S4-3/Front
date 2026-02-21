import Layout from "../components/Layout"; 
import { Badge } from "../components/ui/badge";
import { 
  Card,   
  CardHeader,
  CardTitle ,
  CardDescription,
} from "../components/ui/card";
import {CardContent} from "../components/ui/card";
import { Handshake, Briefcase, Globe, ArrowRight, Sparkles } from "lucide-react";

export default function PartnershipsPage() {
  return (
    <Layout>
      <div className="bg-[#F8FAFC] min-h-screen px-6 pt-28 pb-20 relative text-[#0F172A]">
 
        <div className="absolute top-0 right-0 w-1/3 h-screen bg-[#0055FF]/[0.03] border-l border-[#0F172A]/5 pointer-events-none hidden lg:block" />

        <div className="max-w-4xl mx-auto space-y-12 relative z-10">
 
          <div className="space-y-6 border-b border-[#0F172A]/10 pb-12">
            <div className="flex items-center gap-4">
              <div className="bg-[#0F172A] text-white p-3 shadow-2xl">
                <Handshake size={20} />
              </div>
              <div className="flex gap-2">
                <Badge
                  variant="outline"
                  className="border-[#0F172A]/15 bg-white text-[#0F172A] font-bold uppercase tracking-[0.2em] text-[9px] rounded-none px-3"
                >
                  Business
                </Badge>
                <Badge
                  variant="outline"
                  className="border-[#0055FF]/25 bg-white text-[#0055FF] font-bold uppercase tracking-[0.2em] text-[9px] rounded-none px-3"
                >
                  Strategic
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-6xl md:text-8xl font-serif italic tracking-tighter leading-none">
                Global{" "}
                <span className="font-sans not-italic font-black text-[#0055FF] uppercase">
                  Partners
                </span>
              </h1>
              <p className="text-[#0F172A]/45 font-bold text-[12px] uppercase tracking-[0.3em] flex items-center gap-3">
                <Sparkles size={14} className="text-[#0055FF]" /> 기술 협업 및 기업
                도입 문의
              </p>
            </div>
          </div>

    
          <div className="grid md:grid-cols-2 gap-10">
            <section className="space-y-6">
              <h2 className="text-[12px] font-black uppercase tracking-[0.28em] text-[#0F172A] flex items-center gap-3">
                <Briefcase size={16} className="text-[#0055FF]" /> Enterprise
                Solutions
              </h2>
              <div className="space-y-4">
                <SolutionItem
                  title="Mass Pipeline"
                  desc="기관 및 기업을 위한 대량 데이터 자동 변환 파이프라인 구축"
                />
                <SolutionItem
                  title="SDK & API"
                  desc="기존 서비스에 3D 뷰어 및 생성 기능을 통합하는 개발자 도구"
                />
                <SolutionItem
                  title="Museum Archive"
                  desc="박물관/브랜드 갤러리용 고정밀 3D 디지털 아카이빙"
                />
              </div>
            </section>

            <div className="space-y-8">
              <Card className="border border-[#0F172A]/10 bg-white rounded-none shadow-none p-8 relative group overflow-hidden">
                <div className="absolute top-0 right-0 w-2 h-full bg-[#0055FF] transition-transform translate-y-full group-hover:translate-y-0 duration-500" />
                <CardHeader className="p-0 mb-6">
                  <CardTitle className="text-[18px] font-black uppercase tracking-tight text-[#0F172A]">
                    Collaboration
                  </CardTitle>
                  <CardDescription className="font-medium text-[#0F172A]/50">
                    VoxMesh와 함께 새로운 차원을 설계하세요.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 space-y-6">
                  <p className="text-[13px] leading-relaxed text-[#0F172A]/70 font-medium">
                    베타 기간 동안 전략적 파트너십을 맺을 기업을 찾고 있습니다.
                    전시/커머스/교육 영역에서의 3D 도입을 지원합니다.
                  </p>

                  <button
                    type="button"
                    onClick={() => alert("파트너십 문의 폼 연결 (추후 구현)")}
                    className="group inline-flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-[#0F172A] hover:text-[#0055FF] transition-colors"
                  >
                    Send Inquiry{" "}
                    <ArrowRight
                      size={14}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </button>
                </CardContent>
              </Card>

              <div className="bg-[#0F172A] p-8 text-white relative overflow-hidden">
                <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#0055FF]/25 blur-[120px]" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <Globe size={18} className="text-[#0055FF]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white/70">
                      Global Network
                    </span>
                  </div>
                  <p className="text-[12px] text-white/65 leading-relaxed font-medium">
                    서울 기반. 전 세계 어디서든 원격 기술 지원 및 API 연동이
                    가능합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-[10px] text-[#0F172A]/30 font-bold uppercase tracking-widest pt-12 border-t border-[#0F172A]/5">
            © 2026 VOXMESH STUDIO • Business & Partnerships Department
          </p>
        </div>
      </div>
    </Layout>
  );
}

function SolutionItem({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="p-6 bg-white border border-[#0F172A]/10 hover:border-[#0055FF]/40 transition-all cursor-default">
      <h4 className="font-black text-[13px] uppercase tracking-wider text-[#0F172A] mb-1">
        {title}
      </h4>
      <p className="text-[12px] text-[#0F172A]/60 font-medium leading-tight">
        {desc}
      </p>
    </div>
  );
}