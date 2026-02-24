import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { me } from "../api/auth";
import logo from "../assets/logo.png";

export default function LoginPage() {
  const nav = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function checkSession() {
      try {
        const res = await me();
        if (!mounted) return;
        if (res.authenticated) {
          nav("/", { replace: true });
          return;
        }
      } catch {
        // ignore
      } finally {
        if (mounted) setChecking(false);
      }
    }
    checkSession();
    return () => {
      mounted = false;
    };
  }, []);

  const handlePendingProvider = (provider: string) => {
    window.alert(`${provider} 로그인은 현재 준비 중입니다. 빠르게 지원하겠습니다.`);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#F2F0EB] flex items-center justify-center p-6 font-sans text-[#1A3C34]">

      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-[#1A3C34]/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-[#D95F39]/5 blur-[120px]" />
      </div>

      <div className="w-full max-w-[440px] animate-in fade-in slide-in-from-bottom-8 duration-1000">


        <div className="flex flex-col items-center mb-10">
          <Link to="/" className="flex flex-col items-center group">
            <div className="h-20 w-20 rounded-full overflow-hidden border border-[#1A3C34]/10 bg-white p-2 mb-4 group-hover:scale-105 transition-transform duration-500 shadow-sm">
              <img
                src={logo}
                alt="VoxMesh Studio"
                className="h-full w-full object-cover scale-[1.5] origin-center"
                draggable={false}
              />
            </div>
            <h1 className="text-3xl font-black tracking-tighter uppercase text-[#1A3C34]">
              VoxMesh <span className="font-serif italic font-normal lowercase">Studio</span>
            </h1>
          </Link>
          <p className="text-[10px] font-bold text-[#D95F39] mt-2 uppercase tracking-[0.4em]">
            Digital Asset Pipeline
          </p>
        </div>

        <Card className="border-none rounded-none bg-white shadow-[0_30px_60px_-15px_rgba(26,60,52,0.1)] overflow-hidden">
          {checking ? (
            <>
              <CardHeader className="bg-[#1A3C34] text-[#F2F0EB] px-10 py-10 space-y-2">
                <CardTitle className="text-3xl font-black uppercase tracking-tight">
                  Checking Session
                </CardTitle>
                <CardDescription className="text-[#F2F0EB]/60 font-medium text-xs tracking-wide leading-relaxed">
                  로그인 상태를 확인하고 있습니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-10 py-10">
                <div className="h-[52px] w-full animate-pulse rounded-[6px] bg-[#1A3C34]/5" />
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="bg-[#1A3C34] text-[#F2F0EB] px-10 py-10 space-y-2">
                <CardTitle className="text-3xl font-black uppercase tracking-tight">
                  Social Sign In
                </CardTitle>
                <CardDescription className="text-[#F2F0EB]/60 font-medium text-xs tracking-wide leading-relaxed">
                  구글, 카카오, 네이버 로그인만 제공합니다. <br />
                  로그인 유지 방식은 세션 기반 쿠키입니다.
                </CardDescription>
              </CardHeader>

              <CardContent className="px-10 py-10 grid gap-4">
                <a
                  href="/api/oauth2/login/google"
                  className="flex h-[52px] w-full items-center rounded-[6px] border border-[#747775] bg-white px-4 text-[#1F1F1F] transition-colors hover:bg-[#f8f9fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A3C34]/20"
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center">
                    <img
                      src="https://developers.google.com/static/identity/images/g-logo.png"
                      alt="Google"
                      className="h-5 w-5"
                    />
                  </span>
                  <span className="ml-3 text-[14px] font-medium leading-5 [font-family:Roboto,system-ui,sans-serif]">
                    Google로 로그인
                  </span>
                </a>

                <button
                  type="button"
                  onClick={() => handlePendingProvider("Kakao")}
                  className="flex h-[52px] w-full items-center rounded-[6px] bg-[#FEE500] px-4 text-[rgba(0,0,0,0.85)] transition-colors hover:bg-[#f2db00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A3C34]/20"
                >
                  <KakaoSymbol />
                  <span className="ml-3 text-[15px] font-semibold leading-none">카카오로 로그인</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePendingProvider("Naver")}
                  className="flex h-[52px] w-full items-center rounded-[6px] bg-[#03C75A] px-4 text-white transition-colors hover:bg-[#02b350] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A3C34]/20"
                  aria-label="네이버 로그인"
                >
                  <NaverSymbol />
                  <span className="ml-3 text-[15px] font-semibold leading-none">네이버로 로그인</span>
                </button>
              </CardContent>

              <CardFooter className="px-10 pb-12">
                <p className="w-full text-center text-[11px] font-bold text-[#1A3C34]/40">
                  소셜 계정으로 로그인하고 서비스를 시작하세요.
                </p>
              </CardFooter>
            </>
          )}
        </Card>


        <div className="mt-8 border border-[#1A3C34]/10 p-5 bg-white shadow-sm flex flex-col items-center gap-2">
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#1A3C34]/40">Secure Session</span>
          <p className="text-[11px] text-[#1A3C34]/60 font-medium tracking-tight text-center">
            로그인 상태는 서버가 발급한 세션 쿠키로 안전하게 유지됩니다.
          </p>
        </div>

        <p className="mt-10 text-center text-[9px] text-[#1A3C34]/30 font-bold uppercase tracking-[0.3em]">
          VoxMesh Studio &copy; 2026 Digital Archive
        </p>
      </div>
    </div>
  );
}

function KakaoSymbol() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#000000"
        d="M9 2c-3.87 0-7 2.57-7 5.74 0 2.07 1.34 3.88 3.33 4.88L4.6 15.8c-.06.22.18.4.37.27l3.42-2.24c.2.02.4.03.61.03 3.87 0 7-2.57 7-5.74S12.87 2 9 2z"
      />
    </svg>
  );
}

function NaverSymbol() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#FFFFFF" d="M3 3h4.5l3 4.37V3H15v12h-4.5l-3-4.37V15H3z" />
    </svg>
  );
}
