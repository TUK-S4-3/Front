import Layout from "../components/Layout";
import { Badge } from "../components/ui/badge";
import { Camera, Sparkles, Box, Share2, Lightbulb } from "lucide-react";

export default function ProcessPage() {
  return (
    <Layout>

      <div className="bg-[#F2F0EB] min-h-screen pt-28 pb-20 px-6 text-[#2D2D2D]">
        <div className="max-w-6xl mx-auto space-y-20">
          

          <div className="space-y-6 border-b border-[#1A3C34]/10 pb-10 relative">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="border-[#1A3C34]/20 bg-white text-[#1A3C34] font-bold uppercase tracking-widest text-[9px] rounded-none px-3 py-1">
                Technology
              </Badge>
              <Badge variant="outline" className="border-[#D95F39]/20 bg-transparent text-[#D95F39] font-bold uppercase tracking-widest text-[9px] rounded-none px-3 py-1">
                Pipeline
              </Badge>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-6xl md:text-8xl font-serif italic tracking-tighter leading-none">
                How it <span className="font-sans not-italic font-black text-[#1A3C34] uppercase text-5xl md:text-7xl">Works</span>
              </h1>
              <p className="text-[#1A3C34]/60 font-medium max-w-2xl text-lg leading-relaxed">
                복잡한 3D 데이터 분석 과정을 예술적인 경험으로 전환합니다. 
                <span className="block mt-2 italic text-[#1A3C34]/30 font-serif text-base font-normal">
                  Our cloud-based engine transforms simple video captures into high-fidelity digital assets.
                </span>
              </p>
            </div>

            <div className="absolute top-0 right-0 text-[120px] font-black text-[#1A3C34]/[0.02] select-none pointer-events-none hidden lg:block uppercase leading-none">
              Engine
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ProcessStep 
              num="01"
              icon={<Camera size={20} />}
              title="Capture"
              tag="Visual Input"
              desc="대상을 중심으로 360도 천천히 회전하며 영상을 기록하세요. 고해상도와 안정적인 초점이 핵심입니다."
            />
            <ProcessStep 
              num="02"
              icon={<Sparkles size={20} />}
              title="Analyze"
              tag="Frame Tracking"
              desc="클라우드 서버가 영상의 수천 개의 프레임을 분석하여 피사체의 특징점(Keypoints)을 추출합니다."
            />
            <ProcessStep 
              num="03"
              icon={<Box size={20} />}
              title="Mesh"
              tag="Reconstruction"
              desc="AI 엔진이 공간 정보를 재구축하여 정교한 폴리곤 메시와 고해상도 텍스처를 생성합니다."
            />
            <ProcessStep 
              num="04"
              icon={<Share2 size={20} />}
              title="Deploy"
              tag="Universal Asset"
              desc="최종 결과물은 표준 GLB 포맷으로 제공되어 웹, 엔진, XR 환경 어디서든 즉시 사용 가능합니다."
            />
          </div>


          <section className="bg-[#1A3C34] text-[#F2F0EB] overflow-hidden relative group">
      
             <div className="absolute top-0 right-0 w-64 h-64 bg-[#D95F39]/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-[#D95F39]/20 transition-all duration-1000" />
             
             <div className="grid md:grid-cols-3 gap-0">
               <div className="p-12 md:p-16 border-b md:border-b-0 md:border-r border-[#F2F0EB]/10 flex flex-col justify-center space-y-4">
                  <div className="w-12 h-12 bg-[#D95F39] flex items-center justify-center">
                    <Lightbulb size={24} className="text-white" />
                  </div>
                  <h2 className="text-3xl font-black uppercase tracking-tight">Expert<br/>Tips</h2>
                  <p className="text-[#F2F0EB]/50 text-sm leading-relaxed">최상의 퀄리티를 위해<br/>다음 환경을 권장합니다.</p>
               </div>
               
               <div className="md:col-span-2 p-12 md:p-16 grid sm:grid-cols-2 gap-x-12 gap-y-8">
                  {[
                    "대상 주변을 일정한 속도로 회전하며 촬영하세요.",
                    "그림자가 강하지 않은 고른 확산광이 유리합니다.",
                    "유리나 금속 같은 반사 재질은 피하는 것이 좋습니다.",
                    "4K 해상도의 60fps MP4/MOV 형식을 권장합니다.",
                    "피사체가 화면의 중심을 가득 채우도록 하세요.",
                    "초점이 엇나간 프레임은 품질 저하의 원인이 됩니다."
                  ].map((tip, i) => (
                    <div key={i} className="flex gap-4 items-start group/tip">
                      <div className="w-5 h-5 border border-[#F2F0EB]/20 rounded-full flex items-center justify-center text-[10px] font-black group-hover/tip:bg-[#D95F39] group-hover/tip:border-[#D95F39] transition-all">
                        {i + 1}
                      </div>
                      <p className="text-[13px] text-[#F2F0EB]/70 font-medium leading-snug">{tip}</p>
                    </div>
                  ))}
               </div>
             </div>
          </section>


          <div className="flex justify-center items-center gap-6 pt-10">
            <div className="h-px w-12 bg-[#1A3C34]/10" />
            <p className="text-[10px] text-[#1A3C34]/30 font-bold uppercase tracking-[0.5em]">Powered by VoxMesh AI Pipeline</p>
            <div className="h-px w-12 bg-[#1A3C34]/10" />
          </div>
        </div>
      </div>
    </Layout>
  );
}

function ProcessStep({ num, icon, title, tag, desc }: { num: string, icon: React.ReactNode, title: string, tag: string, desc: string }) {
  return (
    <div className="bg-white border border-[#1A3C34]/5 p-10 space-y-8 hover:border-[#1A3C34]/20 transition-all group">
      <div className="flex justify-between items-start">
        <span className="font-serif italic text-4xl text-[#1A3C34]/10 group-hover:text-[#D95F39]/30 transition-colors duration-500">{num}</span>
        <div className="text-[#1A3C34] group-hover:scale-110 transition-transform duration-500">
          {icon}
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D95F39] mb-1">
            {tag}
          </div>
          <h3 className="text-xl font-black uppercase tracking-tight text-[#1A3C34]">
            {title}
          </h3>
        </div>
        <p className="text-[13px] text-[#1A3C34]/50 font-medium leading-relaxed group-hover:text-[#1A3C34]/70 transition-colors">
          {desc}
        </p>
      </div>
    </div>
  );
}
