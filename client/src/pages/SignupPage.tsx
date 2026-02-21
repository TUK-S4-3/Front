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
import { Loader2, AlertCircle, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
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
      setMsg(res.message || "Welcome to VoxMesh.");

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
    <div className="relative min-h-screen w-full bg-[#F8FAFC] flex items-center justify-center p-6 text-[#1E293B]">

      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-12%] right-[-12%] h-[640px] w-[640px] rounded-full bg-[#0055FF]/10 blur-[140px]" />
        <div className="absolute bottom-[-14%] left-[-14%] h-[560px] w-[560px] rounded-full bg-slate-900/5 blur-[140px]" />
      </div>

      <div className="w-full max-w-[460px] animate-in fade-in slide-in-from-bottom-8 duration-700">

        <div className="flex flex-col items-center mb-10">
          <Link to="/" className="flex flex-col items-center group">
            <div className="h-20 w-20 rounded-3xl overflow-hidden border border-slate-200 bg-white p-3 mb-4 group-hover:scale-[1.03] transition-transform shadow-xl shadow-slate-900/5">

              <img
                src={logo}
                alt="VoxMesh"
                className="h-full w-full object-contain"
                draggable={false}
              />
            </div>

            <h1 className="text-3xl font-black tracking-tighter text-slate-900">
              VoxMesh <span className="text-[#0055FF]">Studio</span>
            </h1>
          </Link>

          <div className="mt-2 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">
            <Sparkles size={12} className="text-[#0055FF]" />
            Join the archive
          </div>
        </div>

        <Card className="border border-slate-200 bg-white rounded-3xl shadow-2xl shadow-slate-900/5 overflow-hidden">
          <CardHeader className="bg-[#0F172A] text-white px-10 py-10 space-y-2">
            <CardTitle className="text-3xl font-black tracking-tight">
              Create account
            </CardTitle>
            <CardDescription className="text-white/60 font-medium text-[12px] leading-relaxed">
              이메일과 비밀번호로 계정을 생성하고
              <br />
              3D 아카이빙을 시작하세요.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSignup}>
            <CardContent className="px-10 py-10 grid gap-6">
        
              <div className="grid gap-2 group">
                <Label
                  htmlFor="email"
                  className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] group-focus-within:text-[#0055FF] transition-colors"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-2xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-0 focus-visible:border-[#0055FF] transition-colors"
                  required
                />
              </div>

      
              <div className="grid gap-2 group">
                <Label
                  htmlFor="password"
                  className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] group-focus-within:text-[#0055FF] transition-colors"
                >
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-2xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-0 focus-visible:border-[#0055FF] transition-colors"
                  required
                />
              </div>

              {err && (
                <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[12px] font-bold text-rose-700 animate-in fade-in">
                  <AlertCircle size={16} />
                  {err}
                </div>
              )}

              {msg && (
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[12px] font-bold text-emerald-700 animate-in fade-in">
                  <CheckCircle2 size={16} />
                  {msg}
                </div>
              )}
            </CardContent>

            <CardFooter className="px-10 pb-12 flex flex-col gap-6">
              <Button
                type="submit"
                className="w-full h-12 rounded-2xl bg-[#0055FF] hover:bg-slate-900 text-white font-black uppercase tracking-[0.2em] text-[11px] transition-all"
                disabled={loading || !!msg}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    Create <ArrowRight size={16} />
                  </span>
                )}
              </Button>

              <div className="text-center text-[11px] font-bold text-slate-500">
                Already have an account?
                <Link
                  to="/login"
                  className="ml-2 text-[#0055FF] font-black border-b border-[#0055FF]/30 hover:border-[#0055FF] transition-colors"
                >
                  Log in
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        <p className="mt-10 text-center text-[10px] text-slate-400 font-bold uppercase tracking-[0.25em] leading-loose">
          By signing up, you agree to our{" "}
          <span className="text-slate-600">Terms</span> &{" "}
          <span className="text-slate-600">Privacy</span>
        </p>
      </div>
    </div>
  );
}