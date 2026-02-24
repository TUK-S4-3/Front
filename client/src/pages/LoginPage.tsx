import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../api/auth";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Loader2, AlertCircle, ArrowRight } from "lucide-react";
import type { FormEvent } from "react";
import logo from "../assets/logo.png";

export default function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault(); 
    setErr("");
    setLoading(true);
    try {
      await login({ email, password });
      nav("/", { replace: true });
    } catch (e: any) {
      setErr(e?.message ?? "이메일 또는 비밀번호를 확인해주세요.");
    } finally {
      setLoading(false);
    }
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
          <CardHeader className="bg-[#1A3C34] text-[#F2F0EB] px-10 py-10 space-y-2">
            <CardTitle className="text-3xl font-black uppercase tracking-tight">
              Sign In
            </CardTitle>
            <CardDescription className="text-[#F2F0EB]/60 font-medium text-xs tracking-wide leading-relaxed">
              스튜디오에 다시 오신 것을 환영합니다. <br />
              프로젝트를 계속 진행하세요.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleLogin}>
            <CardContent className="px-10 py-10 grid gap-6">

              <div className="grid gap-2 group">
                <Label
                  htmlFor="email"
                  className="text-[10px] font-black text-[#1A3C34]/40 uppercase tracking-[0.2em] group-focus-within:text-[#D95F39] transition-colors"
                >
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 rounded-none border-x-0 border-t-0 border-b-2 border-[#1A3C34]/10 bg-transparent px-0 text-[#1A3C34] focus-visible:ring-0 focus-visible:border-[#D95F39] transition-all placeholder:text-[#1A3C34]/20"
                  required
                />
              </div>

 
              <div className="grid gap-2 group">
                <Label
                  htmlFor="password"
                  className="text-[10px] font-black text-[#1A3C34]/40 uppercase tracking-[0.2em] group-focus-within:text-[#D95F39] transition-colors"
                >
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Your passphrase"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 rounded-none border-x-0 border-t-0 border-b-2 border-[#1A3C34]/10 bg-transparent px-0 text-[#1A3C34] focus-visible:ring-0 focus-visible:border-[#D95F39] transition-all placeholder:text-[#1A3C34]/20"
                  required
                />
              </div>

              {err && (
                <div className="flex items-center gap-3 bg-[#D95F39]/5 p-4 text-[11px] font-bold text-[#D95F39] border-l-2 border-[#D95F39] animate-in fade-in slide-in-from-left-2">
                  <AlertCircle size={16} />
                  {err}
                </div>
              )}
            </CardContent>

            <CardFooter className="px-10 pb-12 flex flex-col gap-6">
              <Button
                type="submit"
                className="w-full h-14 rounded-none bg-[#D95F39] hover:bg-[#1A3C34] text-white font-black uppercase tracking-[0.2em] transition-all duration-500 shadow-lg shadow-[#D95F39]/20"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    Access Studio <ArrowRight size={18} />
                  </span>
                )}
              </Button>

              <div className="text-center text-[11px] font-bold text-[#1A3C34]/40 uppercase tracking-widest">
                New to the studio?{" "}
                <Link
                  to="/signup"
                  className="text-[#D95F39] border-b border-[#D95F39]/20 hover:border-[#D95F39] transition-all pb-0.5 ml-2"
                >
                  Create Account
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>


        <div className="mt-8 border border-[#1A3C34]/10 p-5 bg-white shadow-sm flex flex-col items-center gap-2">
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#1A3C34]/40">Internal Testing Only</span>
          <p className="text-[11px] text-[#1A3C34] font-medium font-mono tracking-tight">
            test@test.com <span className="mx-2 text-[#D95F39]">/</span> 12345678
          </p>
        </div>

        <p className="mt-10 text-center text-[9px] text-[#1A3C34]/30 font-bold uppercase tracking-[0.3em]">
          VoxMesh Studio &copy; 2026 Digital Archive
        </p>
      </div>
    </div>
  );
}
