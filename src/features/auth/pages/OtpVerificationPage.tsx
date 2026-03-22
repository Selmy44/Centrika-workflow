import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Mail } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/contexts/ThemeContext";
import ThemeToggleIcon from "@/components/ui/ThemeToggleIcon";

interface OtpVerificationProps {
  email: string;
  onBack: () => void;
}

export default function OtpVerification({ email, onBack }: OtpVerificationProps) {
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);

  const { theme, toggleTheme, switchable } = useTheme();

  const utils = trpc.useUtils();
  const verifyLoginOtp = trpc.auth.verifyLoginOtp.useMutation();

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otpCode || otpCode.length < 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setIsLoading(true);

    try {
      const result = await verifyLoginOtp.mutateAsync({
        email: email,
        code: otpCode,
      });

      if (result.success) {
        toast.success("Logged in successfully!");
        await utils.auth.me.invalidate();
        navigate("/");
      }
    } catch (error: any) {
      toast.error(error.message || "Invalid OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendCountdown(60);
    const interval = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    toast.success("OTP resent to your email!");
  };

  // Individual OTP digit inputs for better UX
  const otpDigits = otpCode.padEnd(6, " ").split("").slice(0, 6);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4 transition-colors duration-300">
      {/* Theme Toggle Top Right */}
      {switchable && (
        <div className="absolute top-6 right-6">
          <button
            onClick={() => toggleTheme?.()}
            title={theme === "dark" ? "Light Mode" : "Dark Mode"}
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-700 transition-all backdrop-blur-sm"
          >
            <ThemeToggleIcon theme={theme} className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      )}
      <div className="w-full max-w-md relative z-10">
        <Card className="bg-white/80 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700 shadow-xl backdrop-blur hover:border-slate-300 dark:hover:border-slate-600 transition-all">
          {/* Header with back button */}
          <CardHeader className="space-y-2 text-center relative pb-6">
            <button
              type="button"
              onClick={onBack}
              disabled={isLoading}
              className="absolute left-6 top-6 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors disabled:opacity-50"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="flex justify-center mb-4">
              <div className="bg-linear-to-br from-orange-500/20 to-amber-500/20 p-4 rounded-full border border-orange-500/30">
                <Mail className="h-8 w-8 text-orange-500" />
              </div>
            </div>

            <CardTitle className="text-2xl text-slate-900 dark:text-white">Verify Your Email</CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">
              We've sent a 6-digit code to <span className="text-orange-600 dark:text-orange-400 font-semibold">{email}</span>
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              {/* OTP Input Section */}
              <div className="space-y-4">
                <Label className="text-slate-700 dark:text-slate-200 block text-center text-sm">Enter Verification Code</Label>

                {/* Single input field */}
                {/* Modern OTP Boxes */}
                <div className="relative group max-w-[340px] mx-auto">
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    value={otpCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setOtpCode(value);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-text text-transparent selection:bg-transparent"
                    required
                    disabled={isLoading}
                    maxLength={6}
                    autoFocus
                  />
                  
                  {/* Visual separated boxes */}
                  <div className="flex justify-between gap-2 max-w-full pointer-events-none pb-2">
                    {[0, 1, 2, 3, 4, 5].map((index) => {
                      const isActive = otpCode.length === index;
                      const hasValue = otpCode.length > index;
                      return (
                        <div
                          key={index}
                          className={`relative flex h-14 w-12 sm:h-16 sm:w-14 items-center justify-center rounded-xl border-2 text-2xl font-bold transition-all duration-300 ${
                            isActive 
                              ? "border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.2)] bg-white dark:bg-slate-800 scale-105 z-10"
                              : hasValue 
                                ? "border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                                : "border-slate-200 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/30 text-transparent group-focus-within:border-slate-300 dark:group-focus-within:border-slate-600"
                          }`}
                        >
                          {otpCode[index] || ""}
                          {isActive && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="w-[1.5px] h-6 bg-orange-500 animate-pulse duration-1000" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading || otpCode.length < 6}
                className="w-full bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold py-3 text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Code"
                )}
              </Button>

              {/* Help Section */}
              <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <p className="text-center text-xs text-slate-600 dark:text-slate-400">
                  Didn't receive the code?
                </p>
                <Button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading || resendCountdown > 0}
                  variant="outline"
                  className="w-full text-orange-600 dark:text-orange-400 border-orange-500/50 hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-orange-500/10 dark:hover:border-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendCountdown > 0 ? (
                    <>Resend in {resendCountdown}s</>
                  ) : (
                    <>Resend Code</>
                  )}
                </Button>
              </div>

              {/* Back to Login */}
              <Button
                type="button"
                onClick={onBack}
                disabled={isLoading}
                variant="ghost"
                className="w-full text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors disabled:opacity-50"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-12 text-center text-slate-500 dark:text-slate-500 text-sm">
          <p>Centrika OnePortal Management System</p>
          <p>© 2026 All rights reserved</p>
        </div>
      </div>
    </div>
  );
}
