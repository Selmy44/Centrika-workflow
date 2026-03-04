import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Mail, Phone, MapPin, Search, Filter } from "lucide-react";
import { useState } from "react";

const employees = [
  { id: 1, name: "John Muigai", email: "john.muigai@centrika.rw", phone: "+256-702-123-456", department: "Engineering", role: "Senior Developer", location: "Kigali", status: "Active" },
  { id: 2, name: "Sarah Kipchoge", email: "sarah.kipchoge@centrika.rw", phone: "+256-702-234-567", department: "Sales", role: "Sales Manager", location: "Nairobi", status: "Active" },
  { id: 3, name: "Mike Kamau", email: "mike.kamau@centrika.rw", phone: "+256-702-345-678", department: "Engineering", role: "UI Designer", location: "Kigali", status: "Active" },
  { id: 4, name: "Emily Kariuki", email: "emily.kariuki@centrika.rw", phone: "+256-702-456-789", department: "Finance", role: "Finance Manager", location: "Kampala", status: "Active" },
  { id: 5, name: "David Ochieng", email: "david.ochieng@centrika.rw", phone: "+256-702-567-890", department: "Operations", role: "Operations Manager", location: "Dar es Salaam", status: "On Leave" },
  { id: 6, name: "Grace Muturi", email: "grace.muturi@centrika.rw", phone: "+256-702-678-901", department: "HR", role: "HR Manager", location: "Kigali", status: "Active" },
  { id: 7, name: "James Kiplagat", email: "james.kiplagat@centrika.rw", phone: "+256-702-789-012", department: "Marketing", role: "Marketing Lead", location: "Kigali", status: "Active" },
  { id: 8, name: "Rose Mutua", email: "rose.mutua@centrika.rw", phone: "+256-702-890-123", department: "Engineering", role: "Backend Developer", location: "Kigali", status: "Inactive" },
];

const departments = Array.from(new Set(employees.map(e => e.department)));

export default function EmployeeDirectory() {
  const { isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState<string | null>(null);

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.phone.includes(searchTerm);
    const matchesDept = !selectedDept || emp.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "On Leave":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "Inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    }
  };

  const getDeptColor = (dept: string) => {
    const colors: Record<string, string> = {
      Engineering: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      Sales: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      Finance: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      Operations: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      HR: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
      Marketing: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return colors[dept] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 p-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Employee Directory
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Contact information and details for all company employees
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search by name, email, or phone..."
              className="pl-10 bg-white dark:bg-slate-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedDept === null ? "default" : "outline"}
              onClick={() => setSelectedDept(null)}
              size="sm"
            >
              All Departments
            </Button>
            {departments.map((dept) => (
              <Button
                key={dept}
                variant={selectedDept === dept ? "default" : "outline"}
                onClick={() => setSelectedDept(dept)}
                size="sm"
              >
                {dept}
              </Button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white dark:bg-slate-800 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Employees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {employees.length}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                in directory
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Active Now
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {employees.filter(e => e.status === "Active").length}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                available for work
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Departments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {departments.length}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                teams
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Employee Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((employee) => (
            <Card
              key={employee.id}
              className="bg-white dark:bg-slate-800 hover:shadow-lg transition-shadow hover:-translate-y-1 duration-200"
            >
              <CardContent className="p-6">
                {/* Header with status */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {employee.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {employee.role}
                    </p>
                  </div>
                  <Badge className={getStatusColor(employee.status)}>
                    {employee.status}
                  </Badge>
                </div>

                {/* Department Badge */}
                <Badge className={`${getDeptColor(employee.department)} mb-4`}>
                  {employee.department}
                </Badge>

                {/* Contact Info */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <a
                      href={`mailto:${employee.email}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline truncate"
                    >
                      {employee.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <a
                      href={`tel:${employee.phone}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {employee.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    {employee.location}
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  variant="outline"
                  className="w-full text-sm"
                >
                  View Profile
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No Results */}
        {filteredEmployees.length === 0 && (
          <Card className="bg-gray-50 dark:bg-slate-900 border-dashed">
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4 opacity-50" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                No employees found
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Try adjusting your search or filter criteria
              </p>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-lg">Directory Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <p>
              <strong>Search Tips:</strong> You can search by employee name, email, or phone number.
            </p>
            <p>
              <strong>Status Indicators:</strong> Green (Active), Yellow (On Leave), Gray (Inactive)
            </p>
            <p>
              <strong>Contact Preference:</strong> Click the email or phone to reach out directly using your default email or phone client.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
