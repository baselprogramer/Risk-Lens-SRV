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
import { HomePage, PricingPage, ApiDocsPage, AboutPage, ContactPage } from "./pages/LandingPage";




// ── Roles ──
const ALL    = ["SUPER_ADMIN", "COMPANY_ADMIN" , "SUBSCRIBER"];
const ADMINS = ["SUPER_ADMIN", "COMPANY_ADMIN"];
const SUPER  = ["SUPER_ADMIN"];


function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

function App() {
  return (
    <BrowserRouter>
    <ScrollToTop />
       <Routes>

      {/* ── Public Landing Pages ── */}
      <Route path="/"         element={<HomePage />} />
      <Route path="/pricing"  element={<PricingPage />} />
      <Route path="/api-docs" element={<ApiDocsPage />} />
      <Route path="/about"    element={<AboutPage />} />
      <Route path="/contact"  element={<ContactPage />} />

      {/* ── Auth ── */}
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
    </BrowserRouter>
  );
}

export default App;
