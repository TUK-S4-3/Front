import type { ReactNode } from "react";
import TopNavPortal from "./TopNavPortal";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F2F0EB] selection:bg-[#5B5BD6]/30">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-[#5B5BD6]/5 blur-[120px]" />
      </div>

      <TopNavPortal />

      <main className="pt-20">{children}</main>
    </div>
  );
}