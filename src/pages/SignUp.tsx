import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PasswordInput } from "@/components/PasswordInput";
import SingleDatePicker from "@/components/SingleDatePicker";

export default function SignUp() {
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
    confirmPassword: "",
    department: "",
    position: "",
    staffId: "",
    dateOfEmployment: "",
    managerId: "",
  });

  const { data: managers = [] } = trpc.users.listHeads.useQuery();
  
  // (backend now prefers one HOD per department, this is a safeguard)
  const uniqueManagers = Array.from(
    new Map(managers.map(m => [((m.department || "__NO_DEPT__").trim().toLowerCase()), m])).values()
  );

  const signUp = trpc.auth.signUp.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.name || !formData.password) {
      toast.error("Please fill in all fields");
      return;
    }

    // Validate company email
    if (!formData.email.endsWith("@centrika.rw")) {
      toast.error("You must use a company email address (username@centrika.rw)");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (!formData.department) {
      toast.error("Please select a department");
      return;
    }

    if (!formData.position) {
      toast.error("Please enter your position");
      return;
    }

    if (!formData.staffId) {
      toast.error("Please enter your staff ID");
      return;
    }

    if (!formData.dateOfEmployment) {
      toast.error("Please select your date of employment");
      return;
    }

    if (!formData.managerId) {
      toast.error("Please select your line manager");
      return;
    }

    setIsLoading(true);

    try {
      const result = await signUp.mutateAsync({
        email: formData.email,
        name: formData.name,
        password: formData.password,
        department: formData.department,
        position: formData.position,
        staffId: formData.staffId,
        dateOfEmployment: formData.dateOfEmployment,
        managerId: parseInt(formData.managerId),
      });

      if (result.success) {
        toast.success("Account created! Redirecting to login...");
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Column - Branding & Welcome - Hidden on mobile */}
          <div className="space-y-6 text-white hidden lg:block">
            <div>
              <img src="/logo/centrikaLogo.png" alt="Centrika" className="h-40 w-auto mb-6" />
              <h1 className="text-4xl font-bold mb-3 leading-tight">Welcome to<br />Centrika OnePortal</h1>
              <p className="text-lg text-white font-semibold">
                Join your team and manage all your requests in one place
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 10 10.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1 text-white">Easy Request Management</h3>
                  <p className="text-white font-medium text-sm">Submit leave, car, and expenditure requests effortlessly</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 10 10.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1 text-white">Auto-Filled Information</h3>
                  <p className="text-white font-medium text-sm">Your profile data automatically populates forms</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 10 10.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1 text-white">Instant Approvals</h3>
                  <p className="text-white font-medium text-sm">Fast-track your requests through the system</p>
                </div>
              </div>
            </div>
          </div>          {/* Right Column - Form */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur hover:border-slate-700">
            <CardHeader className="space-y-2 pb-6">
              <CardTitle className="text-3xl font-bold text-white">Create Account</CardTitle>
              <CardDescription className="text-slate-400 font-medium">
                Set up your profile to get started
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email - Full Width */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-200 font-semibold text-sm">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="username@centrika.rw"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 hover:bg-slate-700/70 transition-colors"
                    required
                  />
                </div>

                {/* Name - Full Width */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-200 font-semibold text-sm">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 hover:bg-slate-700/70 transition-colors"
                    required
                  />
                </div>

                {/* Two Column Layout for Department & Position */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-slate-200 font-semibold text-sm">
                      Department
                    </Label>
                    <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
                      <SelectTrigger id="department" className="bg-slate-700/50 border-slate-600 text-white hover:bg-slate-700/70 transition-colors">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="Tech" className="text-white">Tech</SelectItem>
                        <SelectItem value="Operations" className="text-white">Operations</SelectItem>
                        <SelectItem value="Finance" className="text-white">Finance</SelectItem>
                        <SelectItem value="Administrator" className="text-white">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="position" className="text-slate-200 font-semibold text-sm">
                      Position
                    </Label>
                    <Input
                      id="position"
                      type="text"
                      placeholder="Job title"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 hover:bg-slate-700/70 transition-colors"
                      required
                    />
                  </div>
                </div>

                {/* Two Column Layout for Staff ID & Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="staffId" className="text-slate-200 font-semibold text-sm">
                      Staff ID
                    </Label>
                    <Input
                      id="staffId"
                      type="text"
                      placeholder="e.g., EMP-001"
                      value={formData.staffId}
                      onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                      className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 hover:bg-slate-700/70 transition-colors"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfEmployment" className="text-slate-200 font-semibold text-sm">
                      Employment Date
                    </Label>
                    <SingleDatePicker
                      value={formData.dateOfEmployment}
                      onChange={(date) => setFormData({ ...formData, dateOfEmployment: date })}
                      label="Employment Date"
                      autoClose={true}
                    />
                  </div>
                </div>

                {/* Line Manager - Full Width */}
                <div className="space-y-2">
                  <Label htmlFor="managerId" className="text-slate-200 font-semibold text-sm">
                    Line Manager / HOD
                  </Label>
                  <Select value={formData.managerId} onValueChange={(value) => setFormData({ ...formData, managerId: value })}>
                    <SelectTrigger id="managerId" className="bg-slate-700/50 border-slate-600 text-white hover:bg-slate-700/70 focus:border-blue-500 transition-all duration-200">
                      <SelectValue placeholder="Select your manager" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {uniqueManagers && uniqueManagers.length > 0 ? (
                        uniqueManagers.map((manager) => (
                          <SelectItem key={manager.id} value={manager.id.toString()} className="text-white">
                            {manager.name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-slate-400">No managers available</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Two Column Layout for Password Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <PasswordInput
                    label="Password"
                    value={formData.password}
                    onChange={(password) => setFormData({ ...formData, password })}
                    placeholder="••••••••"
                    id="password"
                  />

                  <PasswordInput
                    label="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={(confirmPassword) => setFormData({ ...formData, confirmPassword })}
                    placeholder="••••••••"
                    id="confirmPassword"
                  />
                </div>

                {/* Submit Button - Full Width */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>

                {/* Login Link */}
                <p className="text-center text-slate-400 text-sm pt-2">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                  >
                    Sign In
                  </button>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
