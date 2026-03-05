import Layout from "../components/Layout";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Handshake, Briefcase, Globe, ArrowRight, Sparkles } from "lucide-react";

export default function PartnershipsPage() {
  return (
    <Layout>

      <div className="bg-[#F2F0EB] min-h-screen px-6 pt-28 pb-20 relative text-[#2D2D2D]">

        <div className="absolute top-0 right-0 w-1/3 h-screen bg-[#1A3C34]/[0.02] border-l border-[#1A3C34]/5 pointer-events-none hidden lg:block" />
        
        <div className="max-w-4xl mx-auto space-y-12 relative z-10">
          
      
          <div className="space-y-6 border-b border-[#1A3C34]/10 pb-12">
            <div className="flex items-center gap-4">
              <div className="bg-[#1A3C34] text-[#F2F0EB] p-3 shadow-2xl">
                <Handshake size={20} />
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="border-[#1A3C34]/20 bg-white text-[#1A3C34] font-bold uppercase tracking-[0.2em] text-[9px] rounded-none px-3">
                  Business
                </Badge>
                <Badge variant="outline" className="border-[#D95F39]/20 bg-transparent text-[#D95F39] font-bold uppercase tracking-[0.2em] text-[9px] rounded-none px-3">
                  Strategic
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-6xl md:text-8xl font-serif italic tracking-tighter leading-none">
                Global <span className="font-sans not-italic font-black text-[#1A3C34] uppercase">Partners</span>
              </h1>
              <p className="text-[#1A3C34]/40 font-bold text-[12px] uppercase tracking-[0.3em] flex items-center gap-3">
                <Sparkles size={14} className="text-[#D95F39]" /> 기술 협업 및 기업 도입 문의
              </p>
            </div>
          </div>


          <div className="grid md:grid-cols-2 gap-8">
            <section className="space-y-6">
              <h2 className="text-[14px] font-black uppercase tracking-[0.3em] text-[#1A3C34] flex items-center gap-3">
                <Briefcase size={16} /> Enterprise Solutions
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
                  desc="박물관 및 브랜드 갤러리용 고정밀 3D 디지털 아카이빙" 
                />
              </div>
            </section>

            <div className="space-y-8">
              <Card className="border border-[#1A3C34]/10 bg-white rounded-none shadow-none p-8 relative group overflow-hidden">
                <div className="absolute top-0 right-0 w-2 h-full bg-[#D95F39] transition-transform translate-y-full group-hover:translate-y-0 duration-500" />
                <CardHeader className="p-0 mb-6">
                  <CardTitle className="text-[18px] font-black uppercase tracking-tight text-[#1A3C34]">Collaboration</CardTitle>
                  <CardDescription className="font-medium text-[#1A3C34]/40">Video To Scene과 함께 새로운 차원을 설계하세요.</CardDescription>
                </CardHeader>
                <CardContent className="p-0 space-y-6">
                  <p className="text-[13px] leading-relaxed text-[#1A3C34]/60">
                    현재 베타 서비스 기간 동안 전략적 파트너십을 맺을 선도적인 기업들을 찾고 있습니다. 
                    전시, 커머스, 교육 분야에서의 혁신적인 3D 도입을 지원합니다.
                  </p>
                  
                  <button className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-[#1A3C34] hover:text-[#D95F39] transition-colors group">
                    Send Inquiry <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </CardContent>
              </Card>

              <div className="bg-[#1A3C34] p-8 text-[#F2F0EB]">
                <div className="flex items-center gap-3 mb-4">
                  <Globe size={18} className="text-[#D95F39]" />
                  <span className="text-[11px] font-bold uppercase tracking-widest">Global Network</span>
                </div>
                <p className="text-[12px] opacity-50 leading-relaxed font-medium">
                  본사는 서울에 위치하며, 전 세계 어디서든 원격 기술 지원 및 API 연동이 가능합니다.
                </p>
              </div>
            </div>
          </div>


          <p className="text-center text-[10px] text-[#1A3C34]/20 font-bold uppercase tracking-widest pt-12 border-t border-[#1A3C34]/5">
            © 2026 VIDEO TO SCENE • Business & Partnerships Department
          </p>
        </div>
      </div>
    </Layout>
  );
}

function SolutionItem({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="p-6 bg-white border border-[#1A3C34]/5 hover:border-[#1A3C34]/20 transition-all cursor-default">
      <h4 className="font-black text-[13px] uppercase tracking-wider text-[#1A3C34] mb-1">{title}</h4>
      <p className="text-[12px] text-[#1A3C34]/50 font-medium leading-tight">{desc}</p>
    </div>
  );
}
