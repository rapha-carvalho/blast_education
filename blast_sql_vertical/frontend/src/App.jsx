import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import RequireAuth from "./components/RequireAuth";
import RequireAdmin from "./components/RequireAdmin";
import LegacyLessonRedirect from "./components/LegacyLessonRedirect";
import CourseReportRedirect from "./components/CourseReportRedirect";
import { AuthProvider } from "./contexts/AuthContext";
import HomePage from "./pages/HomePage";
import CoursePage from "./pages/CoursePage";
import ClassPage from "./pages/ClassPage";
import LoginPage from "./pages/LoginPage";
import PlaygroundPage from "./pages/PlaygroundPage";
import ReportPage from "./pages/ReportPage";
import CheatsheetPage from "./pages/CheatsheetPage";
import CourseReportPage from "./pages/CourseReportPage";
import CheckoutSuccessPage from "./pages/CheckoutSuccessPage";
import CheckoutCancelledPage from "./pages/CheckoutCancelledPage";
import CheckoutPage from "./pages/CheckoutPage";
import CheckoutStartPage from "./pages/CheckoutStartPage";
import AccountPage from "./pages/AccountPage";
import StudyCalendarPage from "./pages/StudyCalendarPage";
import CertificatePage from "./pages/CertificatePage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminUserDetailPage from "./pages/AdminUserDetailPage";
import AdminUserCreatePage from "./pages/AdminUserCreatePage";

function ProtectedLayout() {
  return (
    <RequireAuth>
      <Layout>
        <Outlet />
      </Layout>
    </RequireAuth>
  );
}

function AdminOnly({ children }) {
  return <RequireAdmin>{children}</RequireAdmin>;
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/checkout/sql-zero-avancado" element={<CheckoutStartPage />} />
        <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
        <Route path="/checkout/cancelled" element={<CheckoutCancelledPage />} />
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route
            path="/admin"
            element={
              <AdminOnly>
                <AdminDashboardPage />
              </AdminOnly>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminOnly>
                <AdminUsersPage />
              </AdminOnly>
            }
          />
          <Route
            path="/admin/users/new"
            element={
              <AdminOnly>
                <AdminUserCreatePage />
              </AdminOnly>
            }
          />
          <Route
            path="/admin/users/:userId"
            element={
              <AdminOnly>
                <AdminUserDetailPage />
              </AdminOnly>
            }
          />
          <Route path="/lesson/:lessonId" element={<LegacyLessonRedirect />} />
          <Route path="/playground" element={<Navigate to="/cursos/sql-basico-avancado/playground" replace />} />
          <Route path="/cheatsheet" element={<Navigate to="/cursos/sql-basico-avancado/cheatsheet" replace />} />
          <Route path="/curso-relatorio/:courseSlug" element={<CourseReportRedirect />} />
          <Route path="/cursos/:courseSlug" element={<Outlet />}>
            <Route index element={<CoursePage />} />
            <Route path="aulas/:lessonSlug" element={<ClassPage />} />
            <Route path="cheatsheet" element={<CheatsheetPage />} />
            <Route path="playground" element={<PlaygroundPage />} />
            <Route path="resumo" element={<CourseReportPage />} />
            <Route path="calendario" element={<StudyCalendarPage />} />
            <Route path="minha-conta" element={<AccountPage />} />
            <Route path="certificado" element={<CertificatePage />} />
            <Route path="desafio-final" element={<Navigate to="aulas/desafio-final" replace />} />
          </Route>
          <Route path="/relatorio/:lessonId" element={<ReportPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
