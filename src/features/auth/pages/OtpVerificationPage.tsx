import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Mail } from "lucide-react";
import { trpc } from "@/lib/trpc";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

interface OtpVerificationProps {
  email: string;
  onBack: () => void;
}

export default function OtpVerificationPage({ email, onBack }: OtpVerificationProps) {
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
    <div className="min-h-screen bg-[#f8fafc] relative overflow-hidden flex items-center justify-center p-4">
      {/* Background Mesh Gradients */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-[#3b6dae]/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" />
      <div className="absolute top-0 -right-4 w-96 h-96 bg-[#c79d2d]/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute -bottom-8 left-20 w-96 h-96 bg-[#3b6dae]/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]" />

      <div className="w-full max-w-md relative z-10">
        <Card className="bg-white/80 border-[#3b6dae]/10 backdrop-blur-xl shadow-2xl shadow-[#3b6dae]/10 overflow-hidden">
          {/* Subtle top accent line */}
          <div className="h-1 w-full bg-linear-to-r from-[#3b6dae] to-[#c79d2d]" />

          {/* Header */}
          <CardHeader className="space-y-4 pb-6 pt-10 px-8 text-left">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#3b6dae]/70">
                Get started! 👋
              </p>
              <CardTitle className="text-3xl font-black text-[#3b6dae] tracking-tight">
                Email verification with OTP
              </CardTitle>
            </div>
            <CardDescription className="text-[#3b6dae]/60 font-medium text-sm leading-relaxed max-w-[90%]">
              Enter the verification code sent to your email address.<br/>
              If you haven't received it, click the <span className="font-bold text-[#3b6dae]">Resend Code</span> button below to request a new one.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-10">
            <form onSubmit={handleOtpSubmit} className="space-y-8">
              {/* OTP Input Section */}
              <div className="flex justify-center pt-2">
                <InputOTP
                  maxLength={6}
                  value={otpCode}
                  onChange={(value) => setOtpCode(value)}
                  disabled={isLoading}
                  autoFocus
                >
                  <InputOTPGroup className="gap-3">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <InputOTPSlot
                        key={index}
                        index={index}
                        className="w-14 h-14 text-2xl font-black text-[#3b6dae] border-[#3b6dae]/20 rounded-xl bg-white shadow-sm transition-all focus-within:border-[#3b6dae] focus-within:ring-2 focus-within:ring-[#3b6dae]/20"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isLoading || otpCode.length < 6}
                  className="w-full h-14 bg-[#3b6dae] hover:bg-[#2d5385] text-white font-bold tracking-wide uppercase text-sm shadow-xl shadow-[#3b6dae]/20 transition-all active:scale-[0.98] rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "SIGN IN"
                  )}
                </Button>
              </div>

              {/* Help Section */}
              <div className="pt-6 border-t border-[#3b6dae]/10">
                <p className="text-sm font-medium text-[#3b6dae]/60">
                  Didn't receive code?{" "}
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading || resendCountdown > 0}
                    className="font-bold text-[#3b6dae] hover:text-[#2d5385] hover:underline disabled:opacity-50 disabled:no-underline"
                  >
                    {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : "Resend the Code"}
                  </button>
                </p>
              </div>

              {/* Back to Login */}
              <div className="flex justify-center mt-2">
                <Button
                  type="button"
                  onClick={onBack}
                  disabled={isLoading}
                  variant="ghost"
                  className="h-10 px-4 text-[#3b6dae]/60 hover:text-[#3b6dae] hover:bg-transparent font-bold uppercase tracking-wider text-xs rounded-xl transition-all disabled:opacity-50"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-[#3b6dae]/30 text-[10px] font-black tracking-widest uppercase space-y-1">
          <p>Centrika OnePortal System</p>
          <p>© 2026 All rights reserved</p>
        </div>
      </div>
    </div>
  );
}
