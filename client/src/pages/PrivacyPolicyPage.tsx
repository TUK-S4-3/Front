import Layout from "../components/Layout";
import { Badge } from "../components/ui/badge";
import { Shield, Eye, Archive, Lock, ArrowRight } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <Layout>
      <div className="bg-[#F8FAFC] min-h-screen px-6 pt-28 pb-20 text-[#0F172A]">
        <div className="max-w-3xl mx-auto space-y-14">

          <div className="text-center space-y-6">
            <div className="flex justify-center gap-2">
              <Badge className="bg-[#0F172A] text-white hover:bg-[#0F172A] rounded-none px-4 py-1">
                LEGAL
              </Badge>
              <Badge
                variant="outline"
                className="border-[#0F172A]/15 text-[#0F172A] rounded-none px-4 py-1 bg-white"
              >
                PRIVACY
              </Badge>
              <Badge
                variant="outline"
                className="border-[#0055FF]/20 text-[#0055FF] rounded-none px-4 py-1 bg-white"
              >
                BLUE/WHITE
              </Badge>
            </div>

            <h1 className="text-5xl md:text-6xl font-serif font-light tracking-tight italic">
              Privacy{" "}
              <span className="font-sans font-black not-italic text-[#0055FF]">
                Protocol
              </span>
            </h1>

            <div className="h-px w-24 bg-[#0F172A]/10 mx-auto" />

            <p className="text-[12px] font-bold tracking-[0.22em] text-[#0F172A]/45 uppercase">
              Last updated: February 2026
            </p>
          </div>


          <div className="space-y-10">
            <PolicySection
              number="01"
              icon={<Eye size={20} />}
              title="Media Processing"
              content="사용자가 업로드한 모든 미디어 데이터는 3D Reconstruction 엔진의 결과물 생성 및 품질 개선을 위한 처리 목적에 한해 사용됩니다."
            />

            <PolicySection
              number="02"
              icon={<Archive size={20} />}
              title="Data Retention"
              content="생성된 결과물은 보안 서버 내에서 30일간 보관되며, 이후 별도의 통보 없이 파기될 수 있습니다(정책 변경 시 공지)."
            />

            <PolicySection
              number="03"
              icon={<Shield size={20} />}
              title="Anonymization"
              content="서비스 개선을 위한 통계 데이터는 익명화되며, 개인을 식별할 수 있는 형태로 저장하지 않습니다."
            />
          </div>

     
          <div className="bg-[#0F172A] p-12 text-white flex flex-col md:flex-row items-center gap-10 relative overflow-hidden">
            <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#0055FF]/25 blur-[120px]" />
            <div className="flex-1 space-y-4">
              <div className="inline-flex items-center gap-3">
                <div className="p-3 border border-white/15 rounded-full">
                  <Lock size={22} className="text-white" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/60">
                  Security First
                </span>
              </div>

              <h3 className="text-2xl font-black tracking-tighter uppercase">
                Your data stays yours
              </h3>

              <p className="text-white/60 text-sm leading-relaxed max-w-md font-medium">
                모든 업로드는 전송/저장 단계에서 보호되며, 접근은 인증된 사용자에게만 제한됩니다.
              </p>
            </div>

            <button
              type="button"
              className="group inline-flex items-center gap-3 bg-[#0055FF] text-white px-8 py-4 font-black text-[12px] uppercase tracking-[0.22em] hover:bg-white hover:text-[#0F172A] transition-all"
              onClick={() => alert("문의 채널 연결 (추후 구현)")}
            >
              Inquiry Now
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function PolicySection({
  number,
  icon,
  title,
  content,
}: {
  number: string;
  icon: any;
  title: string;
  content: string;
}) {
  return (
    <div className="flex gap-8 items-start border-t border-[#0F172A]/10 pt-8 group">
      <span className="font-serif italic text-2xl text-[#0F172A]/20 group-hover:text-[#0055FF] transition-colors">
        {number}
      </span>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-[#0F172A]">
          <span className="text-[#0055FF]">{icon}</span>
          <h4 className="font-black uppercase tracking-widest text-[13px]">
            {title}
          </h4>
        </div>

        <p className="text-[#0F172A]/70 leading-relaxed text-[15px] font-medium">
          {content}
        </p>
      </div>
    </div>
  );
}