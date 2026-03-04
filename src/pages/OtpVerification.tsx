import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Mail } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";

interface OtpVerificationProps {
  email: string;
  onBack: () => void;
}

export default function OtpVerification({ email, onBack }: OtpVerificationProps) {
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur hover:border-slate-700">
          {/* Header with back button */}
          <CardHeader className="space-y-2 text-center relative pb-6">
            <button
              type="button"
              onClick={onBack}
              disabled={isLoading}
              className="absolute left-6 top-6 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-br from-orange-500/20 to-amber-500/20 p-4 rounded-full border border-orange-500/30">
                <Mail className="h-8 w-8 text-orange-500" />
              </div>
            </div>

            <CardTitle className="text-2xl text-white">Verify Your Email</CardTitle>
            <CardDescription className="text-slate-400">
              We've sent a 6-digit code to <span className="text-orange-400 font-semibold">{email}</span>
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              {/* OTP Input Section */}
              <div className="space-y-4">
                <Label className="text-slate-200 block text-center text-sm">Enter Verification Code</Label>

                {/* Single input field */}
                <div className="relative">
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    value={otpCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setOtpCode(value);
                    }}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-500 focus:border-orange-500 focus:ring-orange-500/20 hover:bg-slate-700/70 transition-colors text-center text-3xl tracking-[0.5em] font-semibold py-6"
                    required
                    disabled={isLoading}
                    maxLength={6}
                    autoFocus
                  />
                </div>

                {/* Visual OTP dots display */}
                <div className="flex justify-center gap-2 mt-4">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <div
                      key={index}
                      className={`h-3 w-3 rounded-full transition-all ${
                        otpCode.length > index
                          ? "bg-orange-500 scale-100"
                          : "bg-slate-600/50 scale-75"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading || otpCode.length < 6}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold py-3 text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
              <div className="space-y-3 pt-4 border-t border-slate-700">
                <p className="text-center text-xs text-slate-400">
                  Didn't receive the code?
                </p>
                <Button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading || resendCountdown > 0}
                  variant="outline"
                  className="w-full text-orange-400 border-orange-500/50 hover:bg-orange-500/10 hover:border-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="w-full text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors disabled:opacity-50"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-12 text-center text-slate-500 text-sm">
          <p>Centrika OnePortal Management System</p>
          <p>© 2026 All rights reserved</p>
        </div>
      </div>
    </div>
  );
}
