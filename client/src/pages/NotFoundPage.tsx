import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { useNavigate } from "react-router-dom";
import { MoveLeft, Home, AlertTriangle } from "lucide-react";

export default function NotFoundPage() {
  const nav = useNavigate();

  return (
    <Layout>
      <div className="bg-[#F2F0EB] min-h-[80vh] px-6 flex items-center justify-center">
        <div className="max-w-2xl w-full animate-in fade-in zoom-in-95 duration-700">
          
          <Card className="border-none rounded-none bg-white shadow-[0_40px_80px_-15px_rgba(26,60,52,0.15)] overflow-hidden">

            <div className="h-2 bg-[#D95F39]" />
            
            <CardHeader className="px-10 pt-16 pb-10 text-center space-y-4">
              <div className="flex justify-center mb-2">
                <div className="p-4 bg-[#1A3C34] text-white shadow-xl">
                  <AlertTriangle size={32} />
                </div>
              </div>
              <div className="space-y-1">
                <CardTitle className="text-7xl font-black tracking-tighter text-[#1A3C34] uppercase leading-none">
                  404 <br />
                  <span className="text-xl tracking-[0.3em] font-serif italic font-normal lowercase block mt-2 text-[#D95F39]">
                    Lost in Space
                  </span>
                </CardTitle>
              </div>
              <CardDescription className="text-[#1A3C34]/40 font-bold text-xs uppercase tracking-widest pt-4">
                요청하신 페이지를 찾을 수 없습니다. <br />
                주소가 정확한지 확인하거나 아래 버튼을 이용하세요.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-10 pb-16 flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                className="h-14 px-8 rounded-none bg-[#1A3C34] hover:bg-[#D95F39] text-white font-black uppercase tracking-widest transition-all duration-500 group"
                onClick={() => nav("/")}
              >
                <Home size={18} className="mr-3 group-hover:scale-110 transition-transform" />
                Back Home
              </Button>
              
              <Button 
                variant="outline" 
                className="h-14 px-8 rounded-none border-2 border-[#1A3C34] text-[#1A3C34] hover:bg-[#1A3C34] hover:text-white font-black uppercase tracking-widest transition-all duration-500 group"
                onClick={() => nav(-1)}
              >
                <MoveLeft size={18} className="mr-3 group-hover:-translate-x-1 transition-transform" />
                Go Back
              </Button>
            </CardContent>
          </Card>


          <div className="mt-12 text-center">
            <p className="text-[10px] font-black text-[#1A3C34]/20 uppercase tracking-[0.6em]">
              VoxMesh Studio / Error Report 0x404
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}