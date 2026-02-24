import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { ArrowRight, Check } from "lucide-react";
import demoVideo from "../assets/demo.mp4";
import { me } from "../api/auth";
import { Button } from "../components/ui/button";
import { Link } from "react-router-dom";
import back from "../assets/background.png";

const IMG = {
  // HERO: 3D 스캔/포인트클라우드/테크 비주얼
  hero: "https://source.unsplash.com/1600x900/?photogrammetry,3d-scanning,point-cloud,lidar",

  // STEP 1: 촬영/캡처 (카메라/촬영)
  step1: "https://source.unsplash.com/1400x1100/?camera,shooting,studio,product-photography",

  // STEP 2: 재구성/연산 (3D 모델링/워크스테이션/렌더링)
  step2: "https://source.unsplash.com/1400x1100/?3d,modeling,rendering,workstation,cgi",

  // STEP 3: 보관/보안 (서버/데이터센터/스토리지)
  step3: "https://source.unsplash.com/1400x1100/?datacenter,servers,storage,cloud",

  // SHOWCASE: “오브젝트 샘플” (제품컷 계열)
  shoe: "https://source.unsplash.com/1200x900/?sneaker,product",
  helmet: "https://source.unsplash.com/1200x900/?helmet,product",
  watch: "https://source.unsplash.com/1200x900/?watch,product",
};

export default function HomePage() {
  const nav = useNavigate();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function checkSession() {
      try {
        const res = await me();
        if (!mounted) return;
        setAuthed(!!res.authenticated);
      } catch {
        if (!mounted) return;
        setAuthed(false);
      }
    }
    checkSession();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Layout>

      <section className="relative min-h-screen bg-[#F2F0EB] text-[#2D2D2D] selection:bg-[#1A3C34] selection:text-white">
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
              opacity-[0.06]
              grayscale brightness-0
              
            "
          />
        
        
        <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 pb-20 pt-32 text-center">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-[1px] w-8 bg-[#1A3C34]/30" />
            <span className="text-[12px] font-bold uppercase tracking-[0.3em] text-[#1A3C34]">
              Digital Preservation Studio
            </span>
            <div className="h-[1px] w-8 bg-[#1A3C34]/30" />
          </div>

          <h1 className="max-w-5xl text-[56px] font-serif italic leading-[1.1] tracking-tight md:text-[96px]">
            Archive reality, <br />
            <span className="font-sans not-italic font-black text-[#1A3C34] uppercase tracking-tighter">
              preserved forever
            </span>
          </h1>

          <p className="mt-10 max-w-xl text-[16px] font-medium leading-relaxed opacity-70">
            고도의 공간 재구성 기술을 통해 당신의 소중한 오브제를 
            <br />디지털 갤러리 수준의 3D 에셋으로 영구히 기록합니다.
          </p>

          <div className="mt-12 flex flex-col sm:flex-row items-center gap-6">
            <button
              className="group relative flex items-center gap-4 bg-[#1A3C34] px-10 py-5 text-[14px] font-bold text-[#F2F0EB] transition-all hover:pr-12"
              onClick={() => nav(authed ? "/uploads" : "/login")}
            >
              START ARCHIVING
              <ArrowRight size={18} className="absolute right-4 opacity-0 transition-all group-hover:opacity-100" />
            </button>
            <button   type="button"
              onClick={() => nav("/showcase")}
              className="text-[12px] font-bold uppercase tracking-widest border-b border-[#1A3C34] pb-1 hover:opacity-50 transition-opacity">
              View Showcase
            </button>
          </div>

     
          <div className="mt-24 w-full max-w-[1000px] border border-[#1A3C34]/10 p-2 bg-white/50 backdrop-blur-sm">
            <div className="relative aspect-video overflow-hidden bg-[#1A3C34]">
              <video src={demoVideo} autoPlay muted loop playsInline className="h-full w-full object-cover opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A3C34]/40 to-transparent" />
              <div className="absolute bottom-8 left-8 flex gap-12">
                <Metric label="RECONSTRUCTION" value="98.2%" />
                <Metric label="GEOMETRY" value="ULTRA-HIGH" />
              </div>
            </div>
          </div>
        </div>
      </section>


      <section className="bg-[#0A0A0C] text-[#F2F0EB] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-2 gap-y-12 md:grid-cols-4 md:gap-0">
            <StatBox n="99.9" sup="%" l="Preservation SLA" />
            <StatBox n="0.3" sup="s" l="Cloud Latency" />
            <StatBox n="256" sup="bit" l="Encryption" />
            <StatBox n="∞" sup="" l="Scaling Capacity" />
          </div>
        </div>
      </section>


      <section className="bg-[#1A3C34] text-[#F2F0EB] py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="space-y-32">
            {[
              { num: "I", title: "Capture", desc: "고해상도 렌즈를 통해 오브제의 모든 각도를 정교하게 기록합니다.", img: IMG.step1 },
              { num: "II", title: "Synthesize", desc: "신경망 알고리즘이 누락된 기하학적 데이터를 완벽하게 재구성합니다.", img: IMG.step2 },
              { num: "III", title: "Archive", desc: "최종 생성된 에셋은 전용 디지털 금고에 영구히 격리 보관됩니다.", img: IMG.step3 },
            ].map((s, i) => (
              <div
                key={s.num}
                className={`flex flex-col md:flex-row items-center gap-16 ${i % 2 === 1 ? "md:flex-row-reverse" : ""}`}
              >
                <div className="flex-1 space-y-6">
                  <span className="font-serif italic text-4xl opacity-30">{s.num}</span>
                  <h2 className="text-5xl font-black uppercase tracking-tighter">{s.title}</h2>
                  <p className="text-lg opacity-60 leading-relaxed max-w-md">{s.desc}</p>
                </div>

                <div className="flex-1 aspect-[4/5] overflow-hidden grayscale hover:grayscale-0 transition-all duration-1000">
                  <img
                    src={s.img}
                    alt={s.title}
                    className="h-full w-full object-cover scale-110 hover:scale-100 transition-transform duration-1000"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-32 text-[#2D2D2D]">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8 border-b border-[#1A3C34]/10 pb-12">
            <div className="space-y-4">
              <span className="text-[12px] font-bold uppercase tracking-[0.4em] opacity-40">Collection</span>
              <h2 className="text-5xl font-serif italic tracking-tight md:text-6xl">The Archived Objects</h2>
            </div>
            <p className="max-w-xs text-sm opacity-50 font-medium">실제로 변환되어 보관 중인 오브젝트의 디지털 트윈 샘플입니다.</p>
          </div>

          <div className="mt-16 grid gap-1 md:grid-cols-3">
            {[
              { img: IMG.shoe, name: "Luxury Sneaker", id: "01" },
              { img: IMG.helmet, name: "Professional Helmet", id: "02" },
              { img: IMG.watch, name: "Chronograph Watch", id: "03" },
            ].map((obj) => (
              <div key={obj.id} className="group relative aspect-[3/4] overflow-hidden bg-[#F2F0EB]">
                <img src={obj.img} alt={obj.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end text-white translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">Archive No.{obj.id}</div>
                    <div className="text-xl font-bold uppercase tracking-tighter">{obj.name}</div>
                  </div>
                  <button className="h-12 w-12 rounded-full border border-white/30 flex items-center justify-center hover:bg-white hover:text-black transition-colors">
                    <ArrowRight size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      <section className="bg-[#F2F0EB] px-6 py-32">
        <div className="mx-auto max-w-4xl">
          <div className="text-center space-y-6 mb-20">
            <h2 className="text-4xl font-serif italic md:text-6xl">Investment in Memory</h2>
            <div className="h-[1px] w-20 bg-[#1A3C34] mx-auto" />
          </div>
          
          <div className="grid md:grid-cols-2 gap-12">
            <PriceCard 
              title="Individual" 
              price="29" 
              features={["50 Active Scans", "5GB Secure Storage", "Community Access"]} 
            />
            <PriceCard 
              title="Collector" 
              price="89" 
              featured
              features={["Unlimited Scans", "100GB Secure Storage", "API Access", "Priority Support"]} 
            />
          </div>
        </div>
      </section>


      <section className="bg-[#1A3C34] px-6 py-40 text-center">
        <div className="mx-auto max-w-4xl space-y-12">
          <h2 className="text-6xl md:text-8xl font-serif italic text-[#F2F0EB] leading-none">
            Begin your <br />
            <span className="font-sans not-italic font-black text-[#D95F39] uppercase">Eternal Archive</span>
          </h2>
          <div className="flex justify-center">

            <Button
              className="h-20 px-16 bg-[#F2F0EB] text-[#1A3C34] hover:bg-[#D95F39] hover:text-white rounded-none font-black text-lg transition-all"
              onClick={() => nav(authed ? "/uploads" : "/login")}
            >
              GET STARTED NOW
            </Button>
          </div>
        </div>
      </section>


      <footer className="bg-black text-white py-24 px-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 text-left">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <h3 className="text-2xl font-black tracking-tighter uppercase">VoxMesh.</h3>
            <p className="text-white/30 max-w-xs text-sm font-medium">
              세상의 모든 면을 데이터로 기록합니다.
            </p>
            <div className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em]">
              © 2026 MediaTo3D Studio.
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


function StatBox({ n, sup, l }: any) {
  return (
    <div className="text-center md:text-left">
      <div className="text-[56px] font-black tracking-tighter leading-none">
        {n}<span className="text-[20px] text-[#D95F39] ml-1">{sup}</span>
      </div>
      <div className="mt-4 text-[11px] font-bold uppercase tracking-[0.3em] opacity-40">{l}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="text-[10px] font-bold tracking-[0.2em] text-[#F2F0EB]/40 uppercase">{label}</div>
      <div className="text-[18px] font-bold text-[#F2F0EB]">{value}</div>
    </div>
  );
}

function PriceCard({ title, price, features, featured }: any) {
  return (
    <div className={`p-12 border ${featured ? 'bg-[#1A3C34] text-[#F2F0EB] border-[#1A3C34]' : 'bg-white text-[#2D2D2D] border-[#1A3C34]/10'}`}>
      <div className="text-[12px] font-bold uppercase tracking-[0.3em] mb-8 opacity-50">{title}</div>
      <div className="flex items-baseline gap-1 mb-10">
        <span className="text-4xl font-serif italic">$</span>
        <span className="text-7xl font-black tracking-tighter">{price}</span>
      </div>
      <ul className="space-y-5 mb-12">
        {features.map((f: string) => (
          <li key={f} className="flex items-center gap-3 text-sm font-medium opacity-70">
            <Check size={14} className={featured ? 'text-[#D95F39]' : 'text-[#1A3C34]'} /> {f}
          </li>
        ))}
      </ul>
      <button className={`w-full py-4 font-bold text-[12px] uppercase tracking-widest transition-all ${featured ? 'bg-[#F2F0EB] text-[#1A3C34] hover:bg-[#D95F39] hover:text-white' : 'bg-[#1A3C34] text-[#F2F0EB] hover:opacity-80'}`}>
        Select Plan
      </button>
    </div>
  );
}
