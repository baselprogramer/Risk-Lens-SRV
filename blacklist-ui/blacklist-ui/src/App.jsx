import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation , Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import SanctionsSearch from "./pages/SanctionsSearch";
import LocalSanctionsPage from "./pages/LocalSanctionsPage";
import ScreeningPage from "./pages/ScreeningPage";
import SanctionsListPage from "./pages/SanctionsListPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import TransferScreeningPage from "./pages/TransferScreeningPage";
import UserManagementPage from "./pages/UserManagementPage";
import AuditTrailPage from "./pages/AuditTrailPage";
import CaseManagementPage from "./pages/CaseManagementPage";
import ApiKeysPage from "./pages/ApiKeysPage";
import CompaniesPage from "./pages/CompaniesPage";
import WebhooksPage from "./pages/WebhooksPage";
import MonitoringPage from "./pages/MonitoringPage";
import InternalListsPage from "./pages/InternalListsPage";
import ApiWelcomePage from "./pages/ApiLandingPage";
import { LangProvider } from "./context/LangContext";
import ClientWrapper from "./ClientWrapper";
import { AnimatePresence } from "framer-motion";




// ── Roles ──
const ALL    = ["SUPER_ADMIN", "COMPANY_ADMIN" , "SUBSCRIBER"];
const ADMINS = ["SUPER_ADMIN", "COMPANY_ADMIN"];
const SUPER  = ["SUPER_ADMIN"];
const COMPANY = ["COMPANY_ADMIN"]; 


function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

function AppContent() {

  const location = useLocation();

  return(
    <>
      <ScrollToTop />
        <Routes location={location} key={location.pathname}>

        {/* ── Auth ── */}

        <Route path="/" element={<ApiWelcomePage />} />
        <Route path="/login" element={<Login />} />

        {/* ── Protected ── */}
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={ALL}>
            <Dashboard />
          </ProtectedRoute>
        } />

          <Route path="/search" element={
            <ProtectedRoute allowedRoles={ALL}>
              <SanctionsSearch />
            </ProtectedRoute>
          } />

          <Route path="/screen" element={
            <ProtectedRoute allowedRoles={ALL}>
              <ScreeningPage />
            </ProtectedRoute>
          } />

          <Route path="/transfer" element={
            <ProtectedRoute allowedRoles={ALL}>
              <TransferScreeningPage />
            </ProtectedRoute>
          } />

          <Route path="/cases" element={
            <ProtectedRoute allowedRoles={ALL}>
              <CaseManagementPage />
            </ProtectedRoute>
          } />

          <Route path="/local" element={
            <ProtectedRoute allowedRoles={SUPER}>
              <LocalSanctionsPage />
            </ProtectedRoute>
          } />

          <Route path="/internal-lists" element={
            <ProtectedRoute allowedRoles={COMPANY}>
              <InternalListsPage />
            </ProtectedRoute>
          } />

          

          <Route path="/list" element={
            <ProtectedRoute allowedRoles={ADMINS}>
              <SanctionsListPage />
            </ProtectedRoute>
          } />

          <Route path="/audit" element={
            <ProtectedRoute allowedRoles={ADMINS}>
              <AuditTrailPage />
            </ProtectedRoute>
          } />

          <Route path="/users" element={
            <ProtectedRoute allowedRoles={ADMINS}>
              <UserManagementPage />
            </ProtectedRoute>
          } />

          <Route path="/webhooks" element={
            <ProtectedRoute allowedRoles={ADMINS}>
              <WebhooksPage />
            </ProtectedRoute>
          } />

          <Route path="/monitoring" element={
            <ProtectedRoute allowedRoles={ADMINS}>
              <MonitoringPage  />
            </ProtectedRoute>
          } />

          <Route path="/api-keys" element={
            <ProtectedRoute allowedRoles={SUPER}>
              <ApiKeysPage />
            </ProtectedRoute>
          } />

          {/* SUPER_ADMIN فقط */}
          <Route path="/companies" element={
            <ProtectedRoute allowedRoles={SUPER}>
              <CompaniesPage />
            </ProtectedRoute>
          } />

        </Routes>
    </>
)
}

function App() {
  return (
    <LangProvider>
      <ClientWrapper>
        <BrowserRouter>
              <AppContent />
        </BrowserRouter>
      </ClientWrapper>
    </LangProvider>

  );
}

export default App;
