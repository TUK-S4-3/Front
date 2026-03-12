import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { SESSION_USER_REFRESH_EVENT, me, logout } from "../api/auth";
import type { SessionUser } from "../api/types";
import { Archive, ChevronDown, LogOut, UserRound } from "lucide-react";
import logo from "../assets/logo.png";

export default function TopNav() {
  const nav = useNavigate();
  const [authed, setAuthed] = useState(false);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const loadSession = useCallback(async () => {
    let mounted = true;
    try {
      const res = await me();
      if (!mounted) return;
      setAuthed(!!res.authenticated);
      setSessionUser(res.user);
    } catch {
      if (!mounted) return;
      setAuthed(false);
      setSessionUser(null);
    }
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function checkSession() {
      try {
        const res = await me();
        if (!mounted) return;
        setAuthed(!!res.authenticated);
        setSessionUser(res.user);
      } catch {
        if (!mounted) return;
        setAuthed(false);
        setSessionUser(null);
      }
    }
    void checkSession();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const handleRefresh = () => {
      void loadSession();
    };

    window.addEventListener(SESSION_USER_REFRESH_EVENT, handleRefresh);
    return () => {
      window.removeEventListener(SESSION_USER_REFRESH_EVENT, handleRefresh);
    };
  }, [loadSession]);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (menuRef.current && target instanceof Node && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
    };
  }, [menuOpen]);

  const displayName =
    sessionUser?.nickname?.trim() ||
    sessionUser?.name?.trim() ||
    sessionUser?.email?.split("@")[0]?.trim() ||
    "Profile";
  const profileImageUrl = sessionUser?.profileImageUrl?.trim() || "";

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // ignore
    } finally {
      setAuthed(false);
      setSessionUser(null);
      setMenuOpen(false);
      nav("/");
    }
  };

  return (
    <header className="fixed top-0 z-50 w-full border-b border-black/5 bg-white/20 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        
 
        <Link to="/" className="flex items-center gap-3 group">
          <div className="h-12 w-12 rounded-lg overflow-hidden border border-black/10 bg-white transition-transform group-hover:scale-[1.05]">
            <img
              src={logo}
              alt="Video To Scene"
              draggable={false}
              className="h-full w-full object-cover scale-[1.5] origin-center"
            />
          </div>

          <div className="hidden sm:block leading-none">
            <div className="font-black tracking-tighter text-black text-[20px] uppercase">
              Video To Scene
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
            <div ref={menuRef} className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMenuOpen((current) => !current)}
                className="h-11 rounded-full border border-black/10 bg-white/75 px-3 text-black/70 hover:bg-white hover:text-black"
              >
                {profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    alt={displayName}
                    className="mr-3 h-8 w-8 rounded-full object-cover border border-black/10"
                    draggable={false}
                  />
                ) : (
                  <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-[#F2F0EB] text-[12px] font-black uppercase text-[#1A3C34]">
                    {displayName.slice(0, 1)}
                  </span>
                )}
                <span className="max-w-[120px] truncate text-[13px] font-black tracking-tight">
                  {displayName}
                </span>
                <ChevronDown
                  className={`ml-2 h-4 w-4 transition-transform ${menuOpen ? "rotate-180" : ""}`}
                />
              </Button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-3 w-64 border border-black/10 bg-white/95 p-2 shadow-[0_24px_48px_-24px_rgba(0,0,0,0.25)] backdrop-blur-xl">
                  <div className="border-b border-black/5 px-3 py-3">
                    <div className="text-[9px] font-black uppercase tracking-[0.24em] text-black/35">
                      Signed In
                    </div>
                    <div className="mt-2 text-[15px] font-black tracking-tight text-black">
                      {displayName}
                    </div>
                    {sessionUser?.email && (
                      <div className="mt-1 text-[11px] font-medium text-black/45">
                        {sessionUser.email}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      nav("/uploads");
                    }}
                    className="flex w-full items-center gap-3 px-3 py-3 text-left text-[12px] font-black uppercase tracking-[0.18em] text-black/70 transition-colors hover:bg-black/5 hover:text-black"
                  >
                    <Archive size={15} />
                    아카이브
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      nav("/profile");
                    }}
                    className="flex w-full items-center gap-3 px-3 py-3 text-left text-[12px] font-black uppercase tracking-[0.18em] text-black/70 transition-colors hover:bg-black/5 hover:text-black"
                  >
                    <UserRound size={15} />
                    프로필
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-3 py-3 text-left text-[12px] font-black uppercase tracking-[0.18em] text-rose-500 transition-colors hover:bg-rose-500/5"
                  >
                    <LogOut size={15} />
                    로그아웃
                  </button>
                </div>
              )}
            </div>
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
