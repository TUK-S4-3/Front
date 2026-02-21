import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import {
  ArrowRight,
  Check,
  Globe,
  Camera,
  Waypoints,
  Box,
  Cpu,
  Lock,
} from "lucide-react";
import demoVideo from "../assets/demo.mp4";
import { getToken } from "../api/http";
import { Button } from "../components/ui/button";
import { Link } from "react-router-dom";
import back from "../assets/background.png";


const IMG = {
  shoe: "https://source.unsplash.com/1200x900/?sneaker,product",
  helmet: "https://source.unsplash.com/1200x900/?helmet,product",
  watch: "https://source.unsplash.com/1200x900/?watch,product",
};

export default function HomePage() {
  const nav = useNavigate();
  const authed = !!getToken();

  return (
    <Layout>

      <section className="relative min-h-screen bg-[#F8FAFC] text-[#1E293B] selection:bg-[#0055FF] selection:text-white">
       
        <img
          src={back}
          alt=""
          aria-hidden
          draggable={false}
          className="
            pointer-events-none select-none
            absolute z-0
            right-[-220px] top-[40px]
            w-[1100px] max-w-none
            opacity-[0.04]
            grayscale brightness-0
          "
        />

        <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 pb-20 pt-32 text-center">
          <div className="mb-8 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="h-[1px] w-8 bg-[#0055FF]/30" />
            <span className="text-[12px] font-bold uppercase tracking-[0.3em] text-[#0055FF]">
              Digital Preservation Studio
            </span>
            <div className="h-[1px] w-8 bg-[#0055FF]/30" />
          </div>

          <h1 className="max-w-5xl text-[56px] font-serif italic leading-[1.1] tracking-tight md:text-[96px]">
            Archive reality, <br />
            <span className="font-sans not-italic font-black text-[#0055FF] uppercase tracking-tighter">
              preserved forever
            </span>
          </h1>

          <p className="mt-10 max-w-xl text-[16px] font-medium leading-relaxed text-slate-600">
            고도의 공간 재구성 기술을 통해 당신의 소중한 오브제를
            <br />
            디지털 갤러리 수준의 3D 에셋으로 영구히 기록합니다.
          </p>

          <div className="mt-12 flex flex-col items-center gap-6 sm:flex-row">
            <button
              className="group relative flex items-center gap-3 bg-[#0055FF] px-10 py-5 text-[14px] font-bold text-white transition-all hover:shadow-2xl hover:shadow-blue-500/30 active:scale-95"
              onClick={() => nav(authed ? "/uploads" : "/login")}
            >
              START ARCHIVING
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </button>

            <button
              type="button"
              onClick={() => nav("/showcase")}
              className="text-[12px] font-bold uppercase tracking-widest border-b border-[#0055FF] pb-1 text-[#0055FF] hover:opacity-60 transition-opacity"
            >
              View Showcase
            </button>
          </div>


          <div className="mt-24 w-full max-w-[1000px] border border-slate-200 p-2 bg-white/80 backdrop-blur-sm shadow-2xl">
            <div className="relative aspect-video overflow-hidden bg-slate-100">
              <video
                src={demoVideo}
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0055FF]/10 to-transparent" />
              <div className="absolute bottom-8 left-8 flex gap-12">
                <Metric label="RECONSTRUCTION" value="98.2%" />
                <Metric label="GEOMETRY" value="ULTRA-HIGH" />
              </div>
            </div>
          </div>
        </div>
      </section>


      <section className="bg-white text-[#1E293B] py-10 border-y border-slate-100">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <TrustPill icon={<Lock size={18} />} title="AES-256" desc="Encrypted storage" />
            <TrustPill icon={<Box size={18} />} title="GLB Export" desc="Standard 3D asset" />
            <TrustPill icon={<Cpu size={18} />} title="Cloud Compute" desc="Fast reconstruction" />
            <TrustPill icon={<Globe size={18} />} title="Share Link" desc="Web viewer ready" />
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-28 text-[#1E293B]">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8 border-b border-slate-100 pb-10">
            <div className="space-y-3">
              <div className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">
                Real results
              </div>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900">
                See what gets archived
              </h2>
            </div>

            <button
              type="button"
              onClick={() => nav("/showcase")}
              className="text-[12px] font-bold uppercase tracking-widest border-b border-[#0055FF] pb-1 text-[#0055FF] hover:opacity-60 transition-opacity"
            >
              Open Gallery →
            </button>
          </div>

          <div className="mt-12 grid gap-2 md:grid-cols-3">
            {[
              { img: IMG.shoe, name: "Luxury Sneaker", id: "01" },
              { img: IMG.helmet, name: "Professional Helmet", id: "02" },
              { img: IMG.watch, name: "Chronograph Watch", id: "03" },
            ].map((obj) => (
              <div key={obj.id} className="group relative aspect-[3/4] overflow-hidden bg-slate-50">
                <img
                  src={obj.img}
                  alt={obj.name}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-7 left-7 right-7 flex justify-between items-end text-white translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-70">
                      Archive No.{obj.id}
                    </div>
                    <div className="text-lg font-black uppercase tracking-tight">{obj.name}</div>
                  </div>
                  <span className="h-11 w-11 rounded-full border border-white/30 flex items-center justify-center">
                    <ArrowRight size={18} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0F172A] text-white py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="space-y-4 mb-20">
            <div className="text-[11px] font-black uppercase tracking-[0.25em] text-white/40">
              Process
            </div>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter">
              Scan → Reconstruct → Archive
            </h2>
            <p className="text-white/50 font-medium max-w-2xl">
              업로드는 간단하게. 연산은 클라우드에서. 결과는 어디서든 쓰기 쉬운 3D 에셋으로.
            </p>
          </div>

          <div className="space-y-32">
            {[
              {
                num: "I",
                title: "Capture",
                desc: "고해상도 렌즈로 모든 각도를 기록합니다. 스마트폰 촬영만으로도 충분합니다.",
                icon: <Camera size={56} strokeWidth={1.2} />,
                bg: "bg-blue-500/10",
              },
              {
                num: "II",
                title: "Synthesize",
                desc: "수천 개의 프레임을 분석해 누락된 기하학 정보를 재구성합니다.",
                icon: <Waypoints size={56} strokeWidth={1.2} />,
                bg: "bg-indigo-500/10",
              },
              {
                num: "III",
                title: "Archive",
                desc: "생성된 에셋은 안전하게 보관되며, 링크 공유/표준 포맷 출력이 가능합니다.",
                icon: <Box size={56} strokeWidth={1.2} />,
                bg: "bg-sky-500/10",
              },
            ].map((s, i) => (
              <div
                key={s.num}
                className={`flex flex-col md:flex-row items-center gap-24 ${
                  i % 2 === 1 ? "md:flex-row-reverse" : ""
                }`}
              >
                <div className="flex-1 space-y-8 text-left">
                  <span className="font-serif italic text-5xl text-white/10 leading-none">{s.num}</span>
                  <h3 className="text-6xl font-black uppercase tracking-tighter leading-none">
                    {s.title}
                  </h3>
                  <p className="text-xl text-white/55 leading-relaxed max-w-md font-medium">
                    {s.desc}
                  </p>
                </div>

                <div className="flex-1 w-full aspect-square flex items-center justify-center relative group">
                  <div
                    className={`absolute inset-0 rounded-[60px] ${s.bg} scale-90 group-hover:scale-100 transition-transform duration-700 ease-out`}
                  />
                  <div className="relative z-10 w-48 h-48 rounded-[40px] bg-white/95 shadow-2xl shadow-blue-500/10 flex items-center justify-center text-[#0055FF] border border-white/10 transition-transform duration-500 group-hover:-translate-y-6">
                    {s.icon}
                  </div>
                  <div className="absolute top-1/4 right-1/4 w-3 h-3 rounded-full bg-blue-400 opacity-20 animate-ping" />
                  <div className="absolute bottom-1/4 left-1/4 w-12 h-1 bg-blue-200/20 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#F1F5F9] py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <MiniStat n="99.9%" l="Uptime SLA" />
            <MiniStat n="0.3s" l="Sync latency" />
            <MiniStat n="AES-256" l="Encryption" />
            <MiniStat n="GLB" l="Export format" />
          </div>
        </div>
      </section>


      <section className="bg-[#F1F5F9] px-6 py-36">
        <div className="mx-auto max-w-5xl">
          <div className="text-center space-y-6 mb-20">
            <h2 className="text-5xl font-serif italic md:text-7xl text-slate-900">
              Resource Allocation
            </h2>
            <div className="h-[2px] w-24 bg-[#0055FF] mx-auto" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
              Choose your storage tier
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <PriceCard
              title="Individual"
              price="29"
              features={["50 Active Scans", "5GB Secure Storage", "Community Access", "Standard Support"]}
            />
            <PriceCard
              title="Collector"
              price="89"
              featured
              features={[
                "Unlimited Scans",
                "100GB Secure Storage",
                "API Access",
                "Priority Neural Processing",
                "Global Distribution",
              ]}
            />
          </div>
        </div>
      </section>


      <section className="bg-[#0055FF] px-6 py-40 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white rounded-full blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-4xl space-y-12">
          <h2 className="text-6xl md:text-8xl font-serif italic text-white leading-none">
            Begin your <br />
            <span className="font-sans not-italic font-black text-white/90 uppercase tracking-tighter">
              Eternal Archive
            </span>
          </h2>

          <div className="flex justify-center">
            <Button
              className="h-20 px-16 bg-white text-[#0055FF] hover:bg-slate-900 hover:text-white rounded-none font-black text-xl transition-all shadow-2xl"
              onClick={() => nav(authed ? "/uploads" : "/login")}
            >
              DEPLOY SYSTEM NOW
            </Button>
          </div>
        </div>
      </section>


      <footer className="bg-[#020617] text-white py-24 px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <h3 className="text-3xl font-black tracking-tighter uppercase">VoxMesh.</h3>
            <p className="text-white/30 max-w-xs text-sm font-medium leading-relaxed">
              세상의 모든 유기적/기하학적 면을 데이터로 기록하는 차세대 아카이빙 솔루션입니다.
            </p>
            <div className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em]">
              © 2026 VOXMESH STUDIO. ALL SYSTEMS ACTIVE.
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-white/20 font-bold uppercase text-[10px] tracking-[0.2em]">
              Connect
            </h4>
            <ul className="space-y-4 text-sm font-bold text-white/40">
              <li>
                <Link to="/help" className="hover:text-white transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/partnerships" className="hover:text-white transition-colors">
                  Partnerships
                </Link>
              </li>
              <li>
                <Link to="/docs" className="hover:text-white transition-colors">
                  API Docs
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-white/20 font-bold uppercase text-[10px] tracking-[0.2em]">
              Legal
            </h4>
            <ul className="space-y-4 text-sm font-bold text-white/40">
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </Layout>
  );
}



function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="text-[10px] font-bold tracking-[0.2em] text-slate-900/40 uppercase">
        {label}
      </div>
      <div className="text-[20px] font-black text-slate-900">{value}</div>
    </div>
  );
}

function TrustPill({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 flex items-center gap-4">
      <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-[#0055FF]">
        {icon}
      </div>
      <div className="leading-tight">
        <div className="text-[12px] font-black tracking-tight text-slate-900">{title}</div>
        <div className="text-[11px] font-bold text-slate-400">{desc}</div>
      </div>
    </div>
  );
}

function MiniStat({ n, l }: { n: string; l: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5">
      <div className="text-3xl font-black tracking-tighter text-slate-900">{n}</div>
      <div className="mt-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">{l}</div>
    </div>
  );
}

function PriceCard({
  title,
  price,
  features,
  featured,
}: {
  title: string;
  price: string;
  features: string[];
  featured?: boolean;
}) {
  return (
    <div
      className={`p-12 border transition-all duration-500 ${
        featured
          ? "bg-[#0055FF] text-white border-[#0055FF] shadow-2xl shadow-blue-500/30 scale-105 z-10"
          : "bg-white text-slate-800 border-slate-200 hover:border-[#0055FF]/30 shadow-xl"
      }`}
    >
      <div
        className={`text-[12px] font-bold uppercase tracking-[0.4em] mb-10 ${
          featured ? "text-white/60" : "text-slate-400"
        }`}
      >
        {title}
      </div>

      <div className="flex items-baseline gap-1 mb-12">
        <span className="text-4xl font-serif italic">$</span>
        <span className="text-8xl font-black tracking-tighter">{price}</span>
      </div>

      <ul className="space-y-6 mb-16">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-4 text-sm font-bold opacity-90 uppercase tracking-tight">
            <Check size={16} className={featured ? "text-white" : "text-[#0055FF]"} /> {f}
          </li>
        ))}
      </ul>

      <button
        className={`w-full py-5 font-black text-[12px] uppercase tracking-widest transition-all ${
          featured
            ? "bg-white text-[#0055FF] hover:bg-slate-900 hover:text-white"
            : "bg-[#0055FF] text-white hover:bg-slate-900 shadow-lg shadow-blue-500/20"
        }`}
        onClick={() => alert("Select plan clicked")}
        type="button"
      >
        Select Allocation
      </button>
    </div>
  );
}