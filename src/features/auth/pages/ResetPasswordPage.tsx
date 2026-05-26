import React, { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function ResetPasswordPage() {
  const [, navigate] = useLocation();
  const [match] = useRoute("/reset-password");
  
  // Extract token from query parameters
  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get("token");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const resetPasswordMutation = trpc.auth.resetPassword.useMutation();

  if (!match) {
    return null;
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (!token) {
      toast.error("Invalid or missing reset token");
      return;
    }

    setIsResetting(true);

    try {
      await resetPasswordMutation.mutateAsync({
        token,
        newPassword,
      });

      setIsSuccess(true);
      toast.success("Password reset successfully!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Failed to reset password");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#f7f9fc]">
      {/* Force light mode */}
      <style>{`
        .reset-page, .reset-page * { color-scheme: light !important; }
        .reset-page .dark\\:bg-slate-950,
        .reset-page .dark\\:bg-slate-900,
        .reset-page .dark\\:bg-slate-800,
        .reset-page .dark\\:text-white,
        .reset-page .dark\\:text-slate-100,
        .reset-page .dark\\:text-slate-200,
        .reset-page .dark\\:text-slate-300,
        .reset-page .dark\\:text-slate-400,
        .reset-page .dark\\:border-slate-700,
        .reset-page .dark\\:border-slate-600 {
          all: revert;
        }
      `}</style>

      {/* ====== LEFT: Branding Panel ====== */}
      <div className="hidden xl:flex relative w-[45%] flex-col justify-center overflow-hidden">
        <img src="/logo/loginbackground2G.jpeg" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, rgba(30, 64, 120, 0.92) 0%, rgba(59, 109, 174, 0.82) 50%, rgba(59, 109, 174, 0.65) 100%)" }} />
        
        {/* Decorative elements */}
        <div className="absolute top-[12%] left-[10%] w-24 h-24 rounded-full border border-white/10" />
        <div className="absolute top-[28%] left-[18%] w-6 h-6 rounded-full bg-white/8" />
        <div className="absolute bottom-[22%] left-[6%] w-16 h-16 rounded-full border border-white/8" />
        <div className="absolute bottom-[40%] right-[10%] w-10 h-10 rounded-full bg-white/5" />

        <div className="relative z-10 h-full flex flex-col justify-center px-12">
          <div className="mb-8">
            <div className="inline-block rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)" }}>
              <img src="/logo/centrikaLogo.png" alt="Centrika" className="h-32 w-auto drop-shadow-xl" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 leading-tight" style={{ fontFamily: "'Inter', sans-serif" }}>
            Centrika OnePortal
          </h1>
          <p className="text-blue-100/90 text-lg mb-10 max-w-sm">
            Securely update your password to regain access to your workspace.
          </p>
        </div>
      </div>

      {/* ====== RIGHT: Form Panel ====== */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative z-20">
        <div className="w-full max-w-md">
          {!isSuccess ? (
            <>
              <div className="mb-8">
                <h2 className="text-3xl font-semibold mb-1" style={{ color: "#1e3a5f" }}>Reset Password</h2>
                <p style={{ color: "#8ca0b8", fontSize: "14px" }}>
                  Please choose a strong password for your account.
                </p>
              </div>

              {!token ? (
                <div className="p-4 rounded-xl border border-red-100 bg-red-50 mb-6">
                  <p className="text-red-600 text-sm font-medium">Invalid Reset Link</p>
                  <p className="text-red-500/80 text-xs mt-1">This link is missing a valid security token or has expired.</p>
                  <Button onClick={() => navigate("/login")} className="mt-4 w-full h-10 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs">
                    Back to Login
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="new-password" style={{ color: "#5a7a99", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#9bb5cc" }} />
                      <Input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        style={{ paddingLeft: "40px", paddingRight: "40px", height: "48px", background: "#eef3f8", border: "1px solid #d4dfe9", borderRadius: "10px" }}
                        required
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9bb5cc]">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirm-password" style={{ color: "#5a7a99", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#9bb5cc" }} />
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        style={{ paddingLeft: "40px", paddingRight: "40px", height: "48px", background: "#eef3f8", border: "1px solid #d4dfe9", borderRadius: "10px" }}
                        required
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9bb5cc]">
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                    <p style={{ color: "#3b6dae", fontSize: "12px" }}>
                      Password must be at least 6 characters long. Use a mix of letters and numbers for better security.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={isResetting}
                    className="w-full h-12 rounded-full text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all"
                    style={{ background: "linear-gradient(135deg, #3b6dae 0%, #2a8fd4 100%)", border: "none" }}
                  >
                    {isResetting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting...</> : "Update Password"}
                  </Button>

                  <button type="button" onClick={() => navigate("/login")} className="w-full h-11 text-[#3b6dae] text-sm font-medium hover:underline flex items-center justify-center gap-2">
                    <ArrowLeft size={16} /> Back to Login
                  </button>
                </form>
              )}
            </>
          ) : (
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "rgba(34, 197, 94, 0.1)" }}>
                  <CheckCircle className="h-12 w-12" style={{ color: "#22c55e" }} />
                </div>
              </div>
              <h2 className="text-2xl font-semibold mb-2" style={{ color: "#1e3a5f" }}>Success!</h2>
              <p style={{ color: "#5a7a99", fontSize: "14px" }} className="mb-8">
                Your password has been reset successfully. You can now use your new password to log in.
              </p>
              <Button
                onClick={() => navigate("/login")}
                className="w-full h-12 rounded-full text-white font-semibold text-sm shadow-md transition-all"
                style={{ background: "linear-gradient(135deg, #3b6dae 0%, #2a8fd4 100%)", border: "none" }}
              >
                Go to Login
              </Button>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-[#e8eef4]">
            <p className="text-center text-xs" style={{ color: "#b0c4d8" }}>
              Centrika OnePortal &middot; © 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
