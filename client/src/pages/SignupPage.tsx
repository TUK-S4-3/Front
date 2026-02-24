import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signup } from "../api/auth";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Loader2, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import logo from "../assets/logo.png";

export default function SignupPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    setLoading(true);
    try {
      const res = await signup(email, password);
      setMsg(res.message || "Welcome to the Studio!");

      setTimeout(() => {
        nav("/login", { state: { email } });
      }, 1500);
    } catch (e: any) {
      setErr(String(e?.message ?? "회원가입 중 오류가 발생했습니다."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#F2F0EB] flex items-center justify-center p-6 font-sans text-[#1A3C34]">
      
  
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-[#1A3C34]/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-[#D95F39]/5 blur-[120px]" />
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
            Join the 3D Revolution
          </p>
        </div>


        <Card className="border-none rounded-none bg-white shadow-[0_30px_60px_-15px_rgba(26,60,52,0.1)] overflow-hidden">
          <CardHeader className="bg-[#1A3C34] text-[#F2F0EB] px-10 py-10 space-y-2">
            <CardTitle className="text-3xl font-black uppercase tracking-tight">
              Create <br /> Account
            </CardTitle>
            <CardDescription className="text-[#F2F0EB]/60 font-medium text-xs tracking-wide leading-relaxed">
              복스메쉬 스튜디오의 멤버가 되어 <br />
              지능형 3D 에셋 생성을 시작하세요.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSignup}>
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
                  placeholder="At least 8 characters"
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
              {msg && (
                <div className="flex items-center gap-3 bg-[#1A3C34]/5 p-4 text-[11px] font-bold text-[#1A3C34] border-l-2 border-[#1A3C34] animate-in zoom-in-95">
                  <CheckCircle2 size={16} />
                  {msg}
                </div>
              )}
            </CardContent>

            <CardFooter className="px-10 pb-12 flex flex-col gap-6">
              <Button
                type="submit"
                className="w-full h-14 rounded-none bg-[#D95F39] hover:bg-[#1A3C34] text-white font-black uppercase tracking-[0.2em] transition-all duration-500 shadow-lg shadow-[#D95F39]/20"
                disabled={loading || !!msg}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    Start Journey <ArrowRight size={18} />
                  </span>
                )}
              </Button>

              <div className="text-center text-[11px] font-bold text-[#1A3C34]/40 uppercase tracking-widest">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-[#D95F39] border-b border-[#D95F39]/20 hover:border-[#D95F39] transition-all pb-0.5 ml-2"
                >
                  Log in
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        <p className="mt-10 text-center text-[9px] text-[#1A3C34]/30 font-bold uppercase tracking-[0.3em] leading-loose">
          By signing up, you agree to our <br />
          <span className="text-[#1A3C34]/60">Terms of Service</span> & <span className="text-[#1A3C34]/60">Privacy Policy</span>
        </p>
      </div>
    </div>
  );
}