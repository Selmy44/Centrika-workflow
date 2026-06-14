import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFoundPage from "./features/common/pages/NotFoundPage";
import { Route, Switch, useLocation } from "wouter";
import { useEffect } from "react";

function Redirect({ to }: { to: string }) {
  const [, navigate] = useLocation();
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const redirectUrl = searchParams.get("redirect");
    if (redirectUrl) {
      navigate(decodeURIComponent(redirectUrl), { replace: true });
    } else {
      navigate(to, { replace: true });
    }
  }, [navigate, to]);
  return null;
}
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./_core/hooks/useAuth";
import LoginPage from "./features/auth/pages/LoginPage";
import OtpLoginPage from "./features/auth/pages/OtpLoginPage";
import ForgotPasswordPage from "./features/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "./features/auth/pages/ResetPasswordPage";
import AcceptInvitePage from "./features/auth/pages/AcceptInvitePage";
import DashboardPage from "./features/dashboard/DashboardPage";
import TeamStatusPage from "./features/dashboard/TeamStatusPage";
import RequestsPage from "./features/requests/RequestsPage";
import RequestDetailPage from "./features/requests/RequestDetailPage";
import ApprovalsPage from "./features/approvals/ApprovalsPage";
import SettingsPage from "./features/settings/SettingsPage";
import AdminUsersPage from "./features/admin/AdminUsersPage";
import FinancePage from "./features/finance/FinancePage";
import ExpenditureHistoryPage from "./features/finance/ExpenditureHistoryPage";
import LeaveBalancePage from "./features/requests/LeaveBalancePage";
import EmployeeDirectoryPage from "./features/admin/EmployeeDirectoryPage";
import ApprovalHistoryPage from "./features/approvals/ApprovalHistoryPage";
import RequestAnalyticsPage from "./features/approvals/RequestAnalyticsPage";
import TeamStatisticsPage from "./features/approvals/TeamStatisticsPage";
import DepartmentManagementPage from "./features/admin/DepartmentManagementPage";
import EmployeeProfilePage from "./features/admin/EmployeeProfilePage";
import LeaveManagementPage from "./features/hr/LeaveManagementPage";
import DocumentCenterPage from "./features/hr/DocumentCenterPage";
import BudgetManagementPage from "./features/finance/BudgetManagementPage";
import ReportsPage from "./features/common/pages/ReportsPage";
import AssetsPage from "./features/assets/AssetsPage";
import AssetDetailsPage from "./features/assets/AssetDetailsPage";
import { PersonalInsightsPage } from "@/features/resources/pages/PersonalInsightsPage";
import OrganizationViewPage from "./features/users/OrganizationViewPage";
import CentrikaConnectPage from "./features/connect/CentrikaConnectPage";
import { useIdleTimeout } from "./_core/hooks/useIdleTimeout";
import { IdleTimeoutDialog } from "./components/IdleTimeoutDialog";

// Re-index trigger

function Router() {
  const [location, navigate] = useLocation();
  const { isAuthenticated, loading, logout, user } = useAuth();
  const { showWarning, secondsLeft, keepWorking } = useIdleTimeout(isAuthenticated, logout);

  useEffect(() => {
    if (loading) return;

    const isUnauthenticatedRoute = 
      location === "/login" || 
      location === "/otp-login" || 
      location === "/forgot-password" || 
      location === "/reset-password" || 
      location.startsWith("/accept-invite");

    if (isUnauthenticatedRoute) return;

    const searchParams = new URLSearchParams(window.location.search);
    const emailParam = searchParams.get("email");

    if (emailParam) {
      if (isAuthenticated) {
        if (user && user.email && user.email.toLowerCase() === emailParam.toLowerCase()) {
          // Email matches the logged-in user. Clean up the email query param from URL.
          searchParams.delete("email");
          const newSearch = searchParams.toString();
          const cleanPath = `${window.location.pathname}${newSearch ? `?${newSearch}` : ""}`;
          window.history.replaceState(null, "", cleanPath);
        } else if (user) {
          // Email mismatch! Log out first, then navigate to login with email & redirect.
          console.warn(`User mismatch! Logged in as ${user.email}, but link is for ${emailParam}. Logging out.`);
          
          // Build redirect URL representing the current target destination (pathname + search params without email)
          const redirectParams = new URLSearchParams(window.location.search);
          redirectParams.delete("email");
          const redirectSearch = redirectParams.toString();
          const redirectDest = `${window.location.pathname}${redirectSearch ? `?${redirectSearch}` : ""}`;
          
          logout().then(() => {
            navigate(`/login?email=${encodeURIComponent(emailParam)}&redirect=${encodeURIComponent(redirectDest)}`);
          });
        }
      } else {
        // Not authenticated, redirect to login
        const redirectDest = `${window.location.pathname}${window.location.search}`;
        navigate(`/login?email=${encodeURIComponent(emailParam)}&redirect=${encodeURIComponent(redirectDest)}`);
      }
    }
  }, [isAuthenticated, loading, user, navigate, location]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-[#1e3a8a]"></div>
      </div>
    );
  }

  // If not authenticated, show login pages
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route path="/otp-login" component={OtpLoginPage} />
        <Route path="/forgot-password" component={ForgotPasswordPage} />
        <Route path="/reset-password" component={ResetPasswordPage} />
        <Route path="/accept-invite/:token" component={AcceptInvitePage} />
        {/* Default to login page */}
        <Route component={LoginPage} />
      </Switch>
    );
  }

  // If authenticated, show protected routes
  return (
    <>
      <Switch>
        <Route path="/login"><Redirect to="/" /></Route>
        <Route path="/otp-login"><Redirect to="/" /></Route>
        <Route path="/forgot-password"><Redirect to="/" /></Route>
        <Route path="/reset-password" component={ResetPasswordPage} />
        <Route path="/accept-invite/:token" component={AcceptInvitePage} />
        <Route path="/" component={DashboardPage} />
        <Route path="/requests" component={RequestsPage} />
        <Route path="/requests/:id" component={RequestDetailPage} />
        <Route path="/approvals" component={ApprovalsPage} />
        <Route path="/approval-history" component={ApprovalHistoryPage} />
        <Route path="/request-analytics" component={RequestAnalyticsPage} />
        <Route path="/team-statistics" component={TeamStatisticsPage} />
        <Route path="/team-status" component={TeamStatusPage} />
        <Route path="/employee-directory" component={EmployeeDirectoryPage} />
        <Route path="/employees" component={EmployeeDirectoryPage} />
        <Route path="/organization-view" component={OrganizationViewPage} />
        <Route path="/admin/employees/:id" component={EmployeeProfilePage} />
        <Route path="/finance" component={FinancePage} />
        <Route path="/finance/history" component={ExpenditureHistoryPage} />
        <Route path="/finance/budgets" component={BudgetManagementPage} />
        <Route path="/finance/reports">{() => <ReportsPage type="finance" />}</Route>
        <Route path="/expenditure-history" component={ExpenditureHistoryPage} />
        <Route path="/hr/leave" component={LeaveManagementPage} />
        <Route path="/hr/documents" component={DocumentCenterPage} />
        <Route path="/hr/reports">{() => <ReportsPage type="hr" />}</Route>
        <Route path="/departments" component={DepartmentManagementPage} />
        <Route path="/leave-balance" component={LeaveBalancePage} />
        <Route path="/admin/users" component={AdminUsersPage} />
        <Route path="/admin/departments" component={DepartmentManagementPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/insights" component={PersonalInsightsPage} />
        <Route path="/connect" component={CentrikaConnectPage} />
        <Route path="/assets" component={AssetsPage} />
        <Route path="/assets/:id" component={AssetDetailsPage} />
        <Route path="/hr/assets" component={AssetsPage} />
        <Route path="/404" component={NotFoundPage} />
        {/* Final fallback route */}
        <Route component={NotFoundPage} />
      </Switch>
      <IdleTimeoutDialog
        open={showWarning}
        secondsLeft={secondsLeft}
        onKeepWorking={keepWorking}
      />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        switchable={true}
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
