import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFoundPage from "./features/common/pages/NotFoundPage";
import { Route, Switch } from "wouter";
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
import { PolicyKnowledgeBasePage } from "@/features/resources/pages/PolicyKnowledgeBasePage";
import { PersonalInsightsPage } from "@/features/resources/pages/PersonalInsightsPage";
import OrganizationViewPage from "./features/users/OrganizationViewPage";

// Re-index trigger

function Router() {
  const { isAuthenticated, loading } = useAuth();

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
    <Switch>
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
      <Route path="/policies" component={PolicyKnowledgeBasePage} />
      <Route path="/insights" component={PersonalInsightsPage} />
      <Route path="/404" component={NotFoundPage} />
      {/* Final fallback route */}
      <Route component={NotFoundPage} />
    </Switch>
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
