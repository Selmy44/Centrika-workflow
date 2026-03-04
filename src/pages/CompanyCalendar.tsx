import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, AlertCircle, Users, MapPin } from "lucide-react";
import { useState } from "react";

const holidays = [
  { date: "2026-01-01", name: "New Year's Day", type: "public_holiday" },
  { date: "2026-02-01", name: "Independence Day", type: "public_holiday" },
  { date: "2026-04-07", name: "Genocide Remembrance Day", type: "public_holiday" },
  { date: "2026-05-01", name: "Labour Day", type: "public_holiday" },
  { date: "2026-07-01", name: "Liberation Day", type: "public_holiday" },
  { date: "2026-08-15", name: "Assumption of Mary", type: "public_holiday" },
  { date: "2026-11-01", name: "All Saints' Day", type: "public_holiday" },
  { date: "2026-12-25", name: "Christmas Day", type: "public_holiday" },
  { date: "2026-12-26", name: "Boxing Day", type: "public_holiday" },
];

const companyEvents = [
  { date: "2026-03-15", name: "Q1 All-Hands Meeting", type: "company_event", time: "10:00 AM" },
  { date: "2026-06-20", name: "Company Team Building", type: "company_event", time: "All day" },
  { date: "2026-09-15", name: "Mid-Year Review Period", type: "company_event", time: "Ongoing" },
  { date: "2026-11-15", name: "Annual Awards Ceremony", type: "company_event", time: "6:00 PM" },
  { date: "2026-12-18", name: "Holiday Party", type: "company_event", time: "5:00 PM" },
];

export default function CompanyCalendar() {
  const { isAuthenticated } = useAuth();
  const [view, setView] = useState<"list" | "calendar">("list");

  const allEvents = [...holidays, ...companyEvents].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const getEventColor = (type: string) => {
    switch (type) {
      case "public_holiday":
        return "bg-red-100 dark:bg-red-950 border-red-300 dark:border-red-700";
      case "company_event":
        return "bg-blue-100 dark:bg-blue-950 border-blue-300 dark:border-blue-700";
      default:
        return "bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600";
    }
  };

  const getEventBadgeColor = (type: string) => {
    switch (type) {
      case "public_holiday":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "company_event":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getEventLabel = (type: string) => {
    switch (type) {
      case "public_holiday":
        return "Public Holiday";
      case "company_event":
        return "Company Event";
      default:
        return "Event";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 p-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Company Calendar
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Holidays, company events, and important dates for {new Date().getFullYear()}
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2">
          <Button
            variant={view === "list" ? "default" : "outline"}
            onClick={() => setView("list")}
            size="sm"
          >
            List View
          </Button>
          <Button
            variant={view === "calendar" ? "default" : "outline"}
            onClick={() => setView("calendar")}
            size="sm"
          >
            Calendar View
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white dark:bg-slate-800 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Public Holidays
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                {holidays.length}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Non-working days
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Company Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {companyEvents.length}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Scheduled events
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {allEvents.length}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                marked this year
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Events List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            All Events & Holidays
          </h2>
          
          <div className="space-y-3">
            {allEvents.map((event, index) => (
              <Card
                key={index}
                className={`border-l-4 ${getEventColor(event.type)} bg-white dark:bg-slate-800 hover:shadow-md transition-shadow`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {event.name}
                        </h3>
                      </div>
                      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>{formatDate(event.date)}</span>
                        {(event as any).time && (
                          <>
                            <span className="hidden md:inline">•</span>
                            <span>{(event as any).time}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Badge className={getEventBadgeColor(event.type)}>
                      {getEventLabel(event.type)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Information Card */}
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              Important Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <p>
              <strong>Public Holidays:</strong> All employees are off on public holidays unless prior arrangements were made.
            </p>
            <p>
              <strong>Company Events:</strong> Attendance may be mandatory for some company events. Check with your manager or HR for details.
            </p>
            <p>
              <strong>Planning Leave:</strong> Please be mindful of public holidays and company events when planning your leave requests.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
