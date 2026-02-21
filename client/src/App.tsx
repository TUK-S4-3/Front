import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import UploadsPage from "./pages/UploadsPage";
import UploadDetailPage from "./pages/UploadDetailPage";
import AdminUploadsPage from "./pages/AdminUploadsPage"; 
import { getToken } from "./api/http";
import HomePage from "./pages/HomePage";
import ShowcasePage from "./pages/ShowcasePage";
import ProcessPage from "./pages/ProcessPage";
import ProductPage from "./pages/ProductPage";
import NotFoundPage from "./pages/NotFoundPage";
import ShowcaseDetailPage from "./pages/ShowcaseDetailPage";
import HelpCenterPage from "./pages/HelpCenterPage";
import PartnershipsPage from "./pages/PartnershipsPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsPage from "./pages/TermsPage";




// 인증 보호 컴포넌트
function RequireAuth({ children }: { children: ReactNode }) {
  const token = getToken();
  const loc = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }
  return <>{children}</>;
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
        path="/uploads/:id"
        element={
          <RequireAuth>
            <UploadDetailPage />
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
      <Route path="/showcase" element={<ShowcasePage />} />
      <Route path="/process" element={<ProcessPage />} />
      <Route path="/product" element={<ProductPage />} />
      <Route path="*" element={<NotFoundPage />} />
      <Route path="/showcase/:id" element={<ShowcaseDetailPage />} />
      <Route path="/help" element={<HelpCenterPage />} />
      <Route path="/partnerships" element={<PartnershipsPage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/terms" element={<TermsPage />} />


      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}