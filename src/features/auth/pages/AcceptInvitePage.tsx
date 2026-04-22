import { useParams, useLocation } from "wouter";
import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, CheckCircle, Mail, User as UserIcon, Shield } from "lucide-react";
import { toast } from "sonner";

export default function AcceptInvitePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [, navigate] = useLocation();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const verifyToken = (trpc as any).invitations.verifyInvitationToken.useQuery(
    { token: token || "" },
    {
      enabled: !!token,
      retry: false,
    }
  );

  const acceptInvitation = (trpc as any).invitations.acceptInvitation.useMutation({
    onSuccess: (data: any) => {
      setIsSuccess(true);
      toast.success(data.message || "Account activated successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to activate account");
      setIsSubmitting(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    acceptInvitation.mutate({
      token: token || "",
      password,
    });
  };

  const isLoading = verifyToken.isLoading;
  const invitationData = verifyToken.data;
  const error = verifyToken.error || (invitationData && !invitationData.valid ? invitationData.message : null);

  return (
    <div className="min-h-screen w-full flex bg-[#f7f9fc]">
      {/* Force light mode */}
      <style>{`
        .invite-page, .invite-page * { color-scheme: light !important; }
        .invite-page .dark\\:bg-slate-950,
        .invite-page .dark\\:bg-slate-900,
        .invite-page .dark\\:bg-slate-800,
        .invite-page .dark\\:text-white,
        .invite-page .dark\\:text-slate-100,
        .invite-page .dark\\:text-slate-200,
        .invite-page .dark\\:text-slate-300,
        .invite-page .dark\\:text-slate-400,
        .invite-page .dark\\:border-slate-700,
        .invite-page .dark\\:border-slate-600 {
          all: revert;
        }
      `}</style>

      {/* ====== LEFT: Branding Panel ====== */}
      <div className="hidden md:flex relative w-[45%] flex-col justify-center overflow-hidden">
        <img src="/logo/loginbackground2G.jpeg" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, rgba(30, 64, 120, 0.92) 0%, rgba(59, 109, 174, 0.82) 50%, rgba(59, 109, 174, 0.65) 100%)" }} />
        
        {/* Decorative elements */}
        <div className="absolute top-[12%] left-[10%] w-24 h-24 rounded-full border border-white/10" />
        <div className="absolute bottom-[22%] left-[6%] w-16 h-16 rounded-full border border-white/8" />

        <div className="relative z-10 h-full flex flex-col justify-center px-12">
          <div className="mb-8">
            <div className="inline-block rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)" }}>
              <img src="/logo/centrikaLogo.png" alt="Centrika" className="h-32 w-auto drop-shadow-xl" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">Welcome to Centrika</h1>
          <p className="text-blue-100/90 text-lg mb-10 max-w-sm leading-relaxed">
            Your journey starts here. Complete your profile to access the OnePortal ecosystem.
          </p>
          <div className="space-y-4">
            {["Unified Request Management", "Real-time Collaboration", "Secure Business Insights"].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-blue-300" />
                <span className="text-white/80 font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ====== RIGHT: Form Panel ====== */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative z-20">
        <div className="w-full max-w-md">
          {isLoading ? (
            <div className="text-center py-10">
              <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-[#3b6dae]" />
              <p className="text-[#5a7a99] font-medium">Verifying your invitation...</p>
            </div>
          ) : error ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-50 mb-6">
                <Lock className="h-10 w-10 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-[#1e3a5f] mb-3">Invalid Link</h2>
              <p className="text-[#8ca0b8] mb-8 leading-relaxed">
                This invitation link is invalid or has expired. Please contact HR to request a new invitation.
              </p>
              <Button onClick={() => navigate("/login")} className="w-full h-12 rounded-full bg-[#3b6dae] hover:bg-[#2d5385] text-white">
                Back to Login
              </Button>
            </div>
          ) : isSuccess ? (
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full flex items-center justify-center bg-green-50">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-[#1e3a5f] mb-2">Account Ready!</h2>
              <p className="text-[#5a7a99] text-base mb-8">
                Welcome to the team! Your account is now active.
              </p>
              <Button
                onClick={() => navigate("/login")}
                className="w-full h-12 rounded-full bg-[#3b6dae] hover:bg-[#2d5385] text-white font-semibold text-sm shadow-lg tracking-wide"
              >
                Go to Login
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-8 text-center sm:text-left">
                <h2 className="text-3xl font-bold text-[#1e3a5f] mb-2">Activate Account</h2>
                <p className="text-[#8ca0b8] text-sm">
                  Hello <span className="text-[#3b6dae] font-bold">{invitationData?.name}</span>, please set your password to continue.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="h-3.5 w-3.5 text-[#3b6dae]/60" />
                    <span className="text-[10px] uppercase tracking-widest font-black text-[#3b6dae]/40">Email</span>
                  </div>
                  <p className="text-xs font-bold text-[#3b6dae] truncate">{invitationData?.email}</p>
                </div>
                <div className="p-3 bg-orange-50/50 rounded-xl border border-orange-100/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="h-3.5 w-3.5 text-orange-400" />
                    <span className="text-[10px] uppercase tracking-widest font-black text-orange-400/40">Role</span>
                  </div>
                  <p className="text-xs font-bold text-orange-600 capitalize">{invitationData?.role?.replace('_', ' ')}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1.5">
                  <Label htmlFor="password" style={{ color: "#5a7a99", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Set Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9bb5cc]" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 pl-12 bg-white border-[#d4dfe9] rounded-xl focus:ring-[#3b6dae]/20"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password" style={{ color: "#5a7a99", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9bb5cc]" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-12 pl-12 bg-white border-[#d4dfe9] rounded-xl focus:ring-[#3b6dae]/20"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-full bg-[#3b6dae] hover:bg-[#2d5385] text-white font-bold tracking-wide uppercase text-[11px] shadow-xl shadow-[#3b6dae]/20 transition-all active:scale-[0.98]"
                >
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Activating...</> : "Complete Setup"}
                </Button>
              </form>
            </>
          )}

          <div className="mt-12 text-center text-[10px] font-bold text-[#b0c4d8] uppercase tracking-[0.2em] pt-6 border-t border-[#e8eef4]">
            Centrika OnePortal System &middot; © 2026
          </div>
        </div>
      </div>
    </div>
  );
}
