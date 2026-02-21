import type { ReactNode } from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getToken } from "../api/http";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const nav = useNavigate();

  useEffect(() => {
    if (!getToken()) nav("/login");
  }, [nav]);

  return <>{children}</>;
}
