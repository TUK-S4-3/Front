import { Routes, Route, useLocation, Navigate, useParams } from "react-router-dom";
import { useEffect, useState, type ReactNode } from "react";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import UploadsPage from "./pages/UploadsPage";
import UploadDetailPage from "./pages/UploadDetailPage";
import JobViewerPage from "./pages/JobViewerPage";
import AdminUploadsPage from "./pages/AdminUploadsPage"; 
import { me } from "./api/auth";
import HomePage from "./pages/HomePage";
import ShowcasePage from "./pages/ShowcasePage";
import ShowcaseViewerPage from "./pages/ShowcaseViewerPage";
import ProcessPage from "./pages/ProcessPage";
import ProductPage from "./pages/ProductPage";
import NotFoundPage from "./pages/NotFoundPage";
import HelpCenterPage from "./pages/HelpCenterPage";
import PartnershipsPage from "./pages/PartnershipsPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsPage from "./pages/TermsPage";
import ProfilePage from "./pages/ProfilePage";




// 인증 보호 컴포넌트
function RequireAuth({ children }: { children: ReactNode }) {
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

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090B0E] text-white/60 text-[11px] font-bold uppercase tracking-[0.2em]">
        Checking Session...
      </div>
    );
  }

  if (!authed) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }
  return <>{children}</>;
}

function ShowcaseLegacyRedirect() {
  const { id } = useParams();
  if (!id) {
    return <Navigate to="/showcase" replace />;
  }
  return <Navigate to={`/showcase/${encodeURIComponent(id)}/viewer`} replace />;
}


export default function App() {
  return (
    <Routes>
      
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/" element={<HomePage />} />

      <Route
        path="/uploads"
        element={
          <RequireAuth>
            <UploadsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/uploads/:sceneId"
        element={
          <RequireAuth>
            <UploadDetailPage />
          </RequireAuth>
        }
      />
      <Route
        path="/uploads/:sceneId/jobs/:jobId/viewer"
        element={
          <RequireAuth>
            <JobViewerPage />
          </RequireAuth>
        }
      />


      <Route
        path="/admin/uploads"
        element={
          <RequireAuth>
            <AdminUploadsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/profile"
        element={
          <RequireAuth>
            <ProfilePage />
          </RequireAuth>
        }
      />
      <Route path="/showcase" element={<ShowcasePage />} />
      <Route path="/showcase/:id/viewer" element={<ShowcaseViewerPage />} />
      <Route path="/process" element={<ProcessPage />} />
      <Route path="/product" element={<ProductPage />} />
      <Route path="*" element={<NotFoundPage />} />
      <Route path="/showcase/:id" element={<ShowcaseLegacyRedirect />} />
      <Route path="/help" element={<HelpCenterPage />} />
      <Route path="/partnerships" element={<PartnershipsPage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/terms" element={<TermsPage />} />


      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
