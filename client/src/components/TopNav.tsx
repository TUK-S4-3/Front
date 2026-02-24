import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { getToken, clearToken } from "../api/http";
import { LogOut, LayoutDashboard } from "lucide-react";
import logo from "../assets/logo.png";

export default function TopNav() {
  const nav = useNavigate();
  const authed = !!getToken();

  return (
    <header className="fixed top-0 z-50 w-full border-b border-black/5 bg-white/20 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        
 
        <Link to="/" className="flex items-center gap-3 group">
          <div className="h-12 w-12 rounded-lg overflow-hidden border border-black/10 bg-white transition-transform group-hover:scale-[1.05]">
            <img
              src={logo}
              alt="VoxMesh"
              draggable={false}
              className="h-full w-full object-cover scale-[1.5] origin-center"
            />
          </div>

          <div className="hidden sm:block leading-none">
            <div className="font-black tracking-tighter text-black text-[20px] uppercase">
              VoxMesh
            </div>
            <div className="mt-1 text-[9px] font-bold text-black/30 tracking-[0.2em] uppercase">
              Digital Lab
            </div>
          </div>
        </Link>


        <nav className="hidden lg:flex items-center gap-10 text-[12px] font-black uppercase tracking-widest text-black/40">
          <Link to="/showcase" className="hover:text-black transition-colors">
            Showcase
          </Link>
          <Link to="/process" className="hover:text-black transition-colors">
            Process
          </Link>
          <Link to="/product" className="hover:text-black transition-colors">
            Product
          </Link>

          <Badge variant="outline" className="border-black/10 bg-white/50 text-black font-black text-[9px] tracking-tighter">
            BETA 0.1
          </Badge>
        </nav>


        <div className="flex items-center gap-4">
          {authed ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => nav("/uploads")}
                className="text-black/60 hover:text-black hover:bg-black/5 font-bold text-[13px]"
              >
                <LayoutDashboard className="h-4 w-4 mr-2 text-black" />
                Dashboard
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-black/20 hover:text-rose-500 hover:bg-rose-500/5 transition-all"
                onClick={() => {
                  clearToken();
                  nav("/login");
                }}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="text-black/60 font-bold hover:text-black hover:bg-black/5 text-[13px]"
                onClick={() => nav("/login")}
              >
                Sign in
              </Button>

              <Button
                size="sm"
                className="rounded-full bg-black hover:bg-[#BAE6FD] text-white hover:text-black px-7 py-5 text-[13px] font-black transition-all active:scale-95 shadow-[0_10px_20px_rgba(0,0,0,0.1)]"
                onClick={() => nav("/login")}
              >
                START FREE
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}