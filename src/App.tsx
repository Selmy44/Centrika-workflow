import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./_core/hooks/useAuth";
import Login from "./pages/Login";
import OtpLogin from "./pages/OtpLogin";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AcceptInvite from "./pages/AcceptInvite";
import Home from "./pages/Home";
import Requests from "./pages/Requests";
import RequestDetail from "./pages/RequestDetail";
import LeaveRequest from "./pages/LeaveRequest";
import CarRequest from "./pages/CarRequest";
import ExpenditureRequest from "./pages/ExpenditureRequest";
import AssetRequest from "./pages/AssetRequest";
import Approvals from "./pages/Approvals";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import AdminUsers from "./pages/AdminUsers";
import Finance from "./pages/Finance";
import ExpenditureHistory from "./pages/ExpenditureHistory";
import { EmployeeSearch } from "./pages/EmployeeSearch";
import LeaveBalance from "./pages/LeaveBalance";
import CompanyCalendar from "./pages/CompanyCalendar";
import DepartmentReport from "./pages/DepartmentReport";
import LeaveAnalytics from "./pages/LeaveAnalytics";
import BudgetAnalysis from "./pages/BudgetAnalysis";
import EmployeeDirectory from "./pages/EmployeeDirectory";
import ExpenditureTracking from "./pages/ExpenditureTracking";
import SystemSettings from "./pages/SystemSettings";
import ApprovalHistory from "./pages/ApprovalHistory";
import RequestAnalytics from "./pages/RequestAnalytics";
import TeamStatistics from "./pages/TeamStatistics";
import DepartmentManagement from "./pages/DepartmentManagement";

function Router() {
  const { isAuthenticated, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a8a]"></div>
      </div>
    );
  }

  // If not authenticated, show login pages
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/otp-login" component={OtpLogin} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/accept-invite/:token" component={AcceptInvite} />
        {/* Default to login page */}
        <Route component={Login} />
      </Switch>
    );
  }

  // If authenticated, show protected routes
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/requests" component={Requests} />
      <Route path="/requests/:id" component={RequestDetail} />
      <Route path="/requests/leave" component={LeaveRequest} />
      <Route path="/requests/car" component={CarRequest} />
      <Route path="/requests/expenditure" component={ExpenditureRequest} />
      <Route path="/requests/asset" component={AssetRequest} />
      <Route path="/approvals" component={Approvals} />
      <Route path="/approval-history" component={ApprovalHistory} />
      <Route path="/request-analytics" component={RequestAnalytics} />
      <Route path="/team-statistics" component={TeamStatistics} />
      <Route path="/employees" component={EmployeeSearch} />
      <Route path="/employee-directory" component={EmployeeDirectory} />
      <Route path="/finance" component={Finance} />
      <Route path="/expenditure-history" component={ExpenditureHistory} />
      <Route path="/expenditure-tracking" component={ExpenditureTracking} />
      <Route path="/leave-balance" component={LeaveBalance} />
      <Route path="/company-calendar" component={CompanyCalendar} />
      <Route path="/department-report" component={DepartmentReport} />
      <Route path="/leave-analytics" component={LeaveAnalytics} />
      <Route path="/budget-analysis" component={BudgetAnalysis} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/departments" component={DepartmentManagement} />
      <Route path="/profile" component={Profile} />
      <Route path="/settings" component={Settings} />
      <Route path="/system-settings" component={SystemSettings} />
      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

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
