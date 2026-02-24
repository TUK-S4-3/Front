import Layout from "../components/Layout";
import { Badge } from "../components/ui/badge";
import { Shield, Eye, Archive, Lock } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <Layout>
 
      <div className="bg-[#F2F0EB] min-h-screen px-6 pt-28 pb-20 text-[#2D2D2D]">
        <div className="max-w-3xl mx-auto space-y-16">
          
     
          <div className="text-center space-y-6">
            <div className="flex justify-center gap-2">
              <Badge className="bg-[#1A3C34] text-white hover:bg-[#1A3C34] rounded-none px-4 py-1">
                LEGAL
              </Badge>
              <Badge variant="outline" className="border-[#1A3C34] text-[#1A3C34] rounded-none px-4 py-1">
                PRIVACY
              </Badge>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-serif font-light tracking-tight italic">
              Privacy <span className="font-sans font-black not-italic text-[#1A3C34]">Protocol</span>
            </h1>
            
            <div className="h-[1px] w-24 bg-[#1A3C34] mx-auto opacity-30" />
            
            <p className="text-[13px] font-medium tracking-[0.2em] text-[#2D2D2D]/50 uppercase">
              Last updated: February 2026
            </p>
          </div>

          <div className="space-y-12">
            <PolicySection 
              number="01"
              icon={<Eye size={20} />}
              title="Media Processing"
              content="사용자가 업로드한 모든 미디어 데이터는 3D Reconstruction 엔진의 학습 및 결과물 생성을 위해서만 일시적으로 처리됩니다."
            />
            
            <PolicySection 
              number="02"
              icon={<Archive size={20} />}
              title="Data Retention"
              content="생성된 결과물은 보안 서버 내에서 30일간 보관되며, 이후 별도의 통보 없이 영구적으로 파기됩니다."
            />

            <PolicySection 
              number="03"
              icon={<Shield size={20} />}
              title="Anonymization"
              content="서비스 개선을 위한 통계 데이터는 철저히 익명화되며, 어떠한 경우에도 개인을 식별할 수 있는 형태로 저장되지 않습니다."
            />
          </div>


          <div className="bg-[#1A3C34] p-12 text-[#F2F0EB] flex flex-col md:flex-row items-center gap-8 group">
            <div className="flex-1 space-y-4">
              <div className="inline-block p-3 border border-[#F2F0EB]/20 rounded-full">
                <Lock size={24} className="group-hover:rotate-12 transition-transform" />
              </div>
              <h3 className="text-2xl font-bold tracking-tighter uppercase">Security First</h3>
              <p className="text-[#F2F0EB]/60 text-sm leading-relaxed max-w-sm">
                우리는 사용자의 창의적인 데이터가 안전하게 보호될 수 있도록 최상의 보안 환경을 유지합니다.
              </p>
            </div>
            <button className="bg-[#D95F39] text-white px-8 py-4 font-bold text-[12px] uppercase tracking-widest hover:scale-105 transition-all">
              Inquiry Now
            </button>
          </div>

        </div>
      </div>
    </Layout>
  );
}

function PolicySection({ number, icon, title, content }: { number: string; icon: any; title: string; content: string }) {
  return (
    <div className="flex gap-8 items-start border-t border-[#1A3C34]/10 pt-8 group">
      <span className="font-serif italic text-2xl text-[#1A3C34]/20 group-hover:text-[#1A3C34] transition-colors">
        {number}
      </span>
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-[#1A3C34]">
          {icon}
          <h4 className="font-black uppercase tracking-widest text-[14px]">{title}</h4>
        </div>
        <p className="text-[#2D2D2D]/70 leading-relaxed text-[15px] font-medium">
          {content}
        </p>
      </div>
    </div>
  );
}
