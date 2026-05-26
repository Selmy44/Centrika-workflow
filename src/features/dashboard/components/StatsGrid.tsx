import { StatsCard } from "@/components/shared/StatsCard";
import { Clock, CheckCircle, XCircle } from "lucide-react";

interface StatsGridProps {
  stats: any;
  loading: boolean;
  role: string;
}

export const StatsGrid = ({ stats, loading, role }: StatsGridProps) => {
  // Common stats for most roles
  const statsList = [
    {
      title: "Total Requests",
      value: stats?.totalRequests || 0,
      icon: null,
    },
    {
      title: "Pending",
      value: stats?.pendingRequests || 0,
      icon: <Clock size={16} className="text-yellow-500" />,
    },
    {
      title: "Approved",
      value: stats?.approvedRequests || 0,
      icon: <CheckCircle size={16} className="text-green-500" />,
    },
    {
      title: "Rejected",
      value: stats?.rejectedRequests || 0,
      icon: <XCircle size={14} className="text-red-500" />,
    },
  ];

  // Specific adjustments for Admin/HR if needed

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {statsList.map((stat, index) => (
        <StatsCard
          key={index}
          title={stat.title}
          value={loading ? "-" : stat.value}
          icon={stat.icon}
          loading={loading}
        />
      ))}
    </div>
  );
};
