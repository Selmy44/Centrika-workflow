import {
  LayoutDashboard,
  FileText,
  CheckCircle,
  Settings,
  Users,
  Bell,
  TrendingUp,
  Calendar,
  BarChart3,
  Search,
  Building2,
  BookOpen,
  Wallet,
  Receipt,
} from "lucide-react";

export interface SubMenuItem {
  label: string;
  path?: string;
  action?: "leave" | "car" | "expenditure" | "asset";
}

export interface MenuItem {
  icon: any;
  label: string;
  path: string;
  submenu?: SubMenuItem[];
}

export const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  {
    icon: FileText,
    label: "New Request",
    path: "#",
    submenu: [
      { label: "Leave Request", action: "leave" },
      { label: "Car Request", action: "car" },
      { label: "Expenditure Request", action: "expenditure" },
      { label: "Asset Request", action: "asset" },
    ],
  },
  { icon: FileText, label: "My Requests", path: "/requests" },
  { icon: Calendar, label: "Leave Balance", path: "/leave-balance" },
  { icon: BookOpen, label: "Knowledge Base", path: "/policies" },
  { icon: TrendingUp, label: "My Insights", path: "/insights" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export const adminMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  {
    icon: FileText,
    label: "New Request",
    path: "#",
    submenu: [
      { label: "Leave Request", action: "leave" },
      { label: "Car Request", action: "car" },
      { label: "Expenditure Request", action: "expenditure" },
      { label: "Asset Request", action: "asset" },
    ],
  },
  { icon: FileText, label: "My Requests", path: "/requests" },
  { icon: Users, label: "User Management", path: "/admin/users" },
  { icon: Building2, label: "Department Management", path: "/admin/departments" },
  { icon: CheckCircle, label: "Approvals", path: "/approvals" },
  { icon: BookOpen, label: "Knowledge Base", path: "/policies" },
  { icon: Settings, label: "System Settings", path: "/settings" },
];

export const financeMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Finance Dashboard", path: "/" },
  { icon: CheckCircle, label: "Approvals", path: "/approvals" },
  { icon: Receipt, label: "Expenditure History", path: "/finance/history" },
  { icon: Wallet, label: "Budget Management", path: "/finance/budgets" },
  { icon: BarChart3, label: "Finance Reports", path: "/finance/reports" },
  { icon: FileText, label: "My Requests", path: "/requests" },
  {
    icon: FileText,
    label: "New Request",
    path: "#",
    submenu: [
      { label: "Leave Request", action: "leave" },
      { label: "Car Request", action: "car" },
      { label: "Expenditure Request", action: "expenditure" },
      { label: "Asset Request", action: "asset" },
    ],
  },
  { icon: Settings, label: "System Settings", path: "/settings" },
];

export const hrMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "HR Dashboard", path: "/" },
  { icon: Users, label: "Employees", path: "/employee-directory" },
  { icon: Calendar, label: "Leave Management", path: "/hr/leave" },
  { icon: FileText, label: "Document Center", path: "/hr/documents" },
  { icon: BarChart3, label: "HR Reports", path: "/hr/reports" },
  { icon: Building2, label: "Departments", path: "/departments" },
  { icon: CheckCircle, label: "Approvals", path: "/approvals" },
  { icon: FileText, label: "My Requests", path: "/requests" },
  {
    icon: FileText,
    label: "New Request",
    path: "#",
    submenu: [
      { label: "Leave Request", action: "leave" },
      { label: "Car Request", action: "car" },
      { label: "Expenditure Request", action: "expenditure" },
      { label: "Asset Request", action: "asset" },
    ],
  },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export const deptHeadMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: CheckCircle, label: "Pending Approvals", path: "/approvals" },
  { icon: Users, label: "Department Team", path: "/employee-directory" },
  { icon: Calendar, label: "Team Status", path: "/employee-directory" },
  { icon: BarChart3, label: "Team Stats", path: "/team-statistics" },
  { icon: BookOpen, label: "Knowledge Base", path: "/policies" },
  {
    icon: FileText,
    label: "New Request",
    path: "#",
    submenu: [
      { label: "Leave Request", action: "leave" },
      { label: "Car Request", action: "car" },
      { label: "Expenditure Request", action: "expenditure" },
      { label: "Asset Request", action: "asset" },
    ],
  },
  { icon: FileText, label: "My Requests", path: "/requests" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export const ceoMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Executive Dashboard", path: "/" },
  { icon: CheckCircle, label: "Approvals", path: "/approvals" },
  { icon: BarChart3, label: "Reports", path: "/finance/reports" },
  { icon: Users, label: "Organization View", path: "/employee-directory" },
  { icon: Building2, label: "Department Management", path: "/departments" },
  { icon: Search, label: "Employee Directory", path: "/employee-directory" },
  { icon: TrendingUp, label: "Strategic Overview", path: "/request-analytics" },
  { icon: FileText, label: "My Requests", path: "/requests" },
  {
    icon: FileText,
    label: "New Request",
    path: "#",
    submenu: [
      { label: "Leave Request", action: "leave" },
      { label: "Car Request", action: "car" },
      { label: "Expenditure Request", action: "expenditure" },
      { label: "Asset Request", action: "asset" },
    ],
  },
  { icon: Settings, label: "Settings", path: "/settings" },
];
