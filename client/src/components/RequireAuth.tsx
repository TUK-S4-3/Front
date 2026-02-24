import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { me } from "../api/auth";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const loc = useLocation();
  const [checking, setChecking] = useState(true);
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
      } finally {
        if (mounted) setChecking(false);
      }
    }
    checkSession();
    return () => {
      mounted = false;
    };
  }, []);

  if (checking) return null;
  if (!authed) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;

  return <>{children}</>;
}
