import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
// import { getLoginUrl } from "@/const"; // OAuth - Commented out, no longer needed
import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/PasswordInput";
import OtpVerification from "./OtpVerificationPage";

export default function Login() {
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [showOtpPage, setShowOtpPage] = useState(false);
  const [currentEmail, setCurrentEmail] = useState("");
  // const [useOAuth, setUseOAuth] = useState(false); // OAuth - Commented out, no longer needed
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const utils = trpc.useUtils();
  const login = trpc.auth.login.useMutation();
  const devLoginMutation = trpc.auth.devLogin.useMutation();

  // const handleOAuthLogin = () => {
  //   window.location.href = getLoginUrl();
  // }; // OAuth handler - Commented out, no longer needed

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    try {
      const result = await login.mutateAsync({
        email: formData.email,
        password: formData.password,
      });

      if (result.success) {
        toast.success("OTP sent to your email!");
        setCurrentEmail(formData.email);
        setShowOtpPage(true);
      }
    } catch (error: any) {
      toast.error(error.message || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevLogin = async (role: "user" | "admin" | "hr" | "head_of_department" | "head_of_finance" | "ceo_md") => {
    try {
      toast.loading("Signing in...");
      await devLoginMutation.mutateAsync({ role });
      await utils.auth.me.invalidate();
      toast.dismiss();
      toast.success(`Signed in as ${role.replace(/_/g, " ")}!`);
      // Navigate directly instead of reload to avoid flash
      navigate("/");
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to sign in");
    }
  };

  return (
    <>
      {showOtpPage ? (
        <OtpVerification 
          email={currentEmail} 
          onBack={() => {
            setShowOtpPage(false);
            setCurrentEmail("");
          }}
        />
      ) : (
        <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur hover:border-slate-700">
              <CardHeader className="space-y-2 text-center">
                <div className="flex justify-center mb-4">
                  <img src="/logo/centrikaLogo.png" alt="Centrika" className="h-32 w-auto" />
                </div>
                <CardTitle className="text-2xl text-white">Welcome Back</CardTitle>
                <CardDescription className="text-slate-400">
                  Sign in to your Centrika OnePortal account
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-200">
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

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-200">
                      Password
                    </Label>
                    <PasswordInput
                      value={formData.password}
                      onChange={(password) => setFormData({ ...formData, password })}
                      placeholder="••••••••"
                      id="password"
                    />
                    <button
                      type="button"
                      onClick={() => navigate("/forgot-password")}
                      className="text-xs text-blue-400 hover:text-blue-300 font-semibold mt-2"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>

                  <p className="text-center text-slate-400 text-sm">
                    Don't have an account?{" "}
                    <span className="text-blue-400 font-semibold">
                      Contact HR to request access
                    </span>
                  </p>
                </form>

                {/* <div className="mt-6 pt-6 border-t border-slate-600">
                  <p className="text-center text-xs text-slate-500 mb-3">Development - Quick Login</p>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      onClick={() => handleDevLogin("user")}
                      size="sm"
                      variant="ghost"
                      className="text-xs h-8 text-slate-200 hover:text-slate-100 hover:bg-slate-700/50"
                    >
                      Employee
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleDevLogin("head_of_department")}
                      size="sm"
                      variant="ghost"
                      className="text-xs h-8 text-slate-200 hover:text-slate-100 hover:bg-slate-700/50"
                    >
                      Dept Head
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleDevLogin("hr")}
                      size="sm"
                      variant="ghost"
                      className="text-xs h-8 text-slate-200 hover:text-slate-100 hover:bg-slate-700/50"
                    >
                      HR
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleDevLogin("head_of_finance")}
                      size="sm"
                      variant="ghost"
                      className="text-xs h-8 text-slate-200 hover:text-slate-100 hover:bg-slate-700/50"
                    >
                      Finance
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleDevLogin("ceo_md")}
                      size="sm"
                      variant="ghost"
                      className="text-xs h-8 text-slate-200 hover:text-slate-100 hover:bg-slate-700/50"
                    >
                      CEO/MD
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleDevLogin("admin")}
                      size="sm"
                      variant="ghost"
                      className="text-xs h-8 text-slate-200 hover:text-slate-100 hover:bg-slate-700/50"
                    >
                      Admin
                    </Button>
                  </div>
                </div> */}
               
              </CardContent>
            </Card>

            <div className="mt-12 text-center text-slate-500 text-sm">
              <p>Centrika OnePortal Management System</p>
              <p>© 2026 All rights reserved</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
