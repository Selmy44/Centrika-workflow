import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function ResetPasswordPage() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/reset-password?token=:token");
  const token = params?.token as string | undefined;
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const resetPasswordMutation = trpc.auth.resetPassword.useMutation();

  if (!match) {
    return null;
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Invalid Link</CardTitle>
            <CardDescription>This password reset link is not valid or has expired.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate("/login")} 
              className="w-full bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
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

    setIsResetting(true);

    try {
      await resetPasswordMutation.mutateAsync({
        token,
        newPassword,
      });

      toast.success("Password reset successfully!");
      setNewPassword("");
      setConfirmPassword("");
      
      // Redirect to login after 2 seconds
      setTimeout(() => navigate("/login"), 2000);
    } catch (error: any) {
      toast.error(error.message || "Failed to reset password");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfcf6] relative overflow-hidden flex flex-col p-6">
      {/* Background Mesh Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-linear-to-br from-[#1e40af]/10 to-transparent rounded-full blur-[140px] animate-pulse duration-[12s]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-linear-to-tl from-[#fbbf24]/15 to-transparent rounded-full blur-[140px] animate-pulse duration-[18s] delay-[2s]" />
      
      <div className="absolute inset-0 bg-[#fdfcf6]/40 backdrop-blur-[1px]" />

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center relative z-10 py-6">
        <div className="w-full max-w-[480px] md:max-w-[520px] animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <Card className="!bg-white border-white shadow-[0_30px_70px_-20px_rgba(30,64,175,0.15)] backdrop-blur-3xl overflow-hidden rounded-[1.75rem] group border-2">
            <div className="h-1.5 w-full bg-linear-to-r from-[#1e40af] via-[#fbbf24] to-[#1e40af] bg-[length:200%_auto] animate-gradient-x" />

            {!token ? (
              <>
                <CardHeader className="space-y-3 pt-6 pb-2 px-8 text-center border-none">
                  <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20 scale-75">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-circle text-red-500"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                  </div>
                  <div className="space-y-0.5">
                    <CardTitle className="text-2xl leading-tight font-black text-[#1e40af] tracking-tight uppercase">Invalid <span className="text-red-500">Security Link</span></CardTitle>
                    <CardDescription className="text-[#1e40af]/40 font-bold text-[8px] uppercase tracking-[0.2em] leading-relaxed">This protocol link is either malformed, expired, or has already been utilized.</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                  <Button 
                    onClick={() => navigate("/login")} 
                    className="w-full h-12 bg-[#1e40af] hover:bg-[#1e3a8a] text-white font-black tracking-[0.2em] uppercase text-[10px] shadow-xl shadow-[#1e40af]/20 transition-all duration-300 rounded-xl"
                  >
                    Return to Portal Login
                  </Button>
                </CardContent>
              </>
            ) : (
              <>
                <CardHeader className="space-y-3 pt-6 pb-2 px-8 text-center border-none">
                  <div className="flex justify-center relative scale-75">
                    <div className="absolute inset-0 bg-[#1e40af]/5 blur-3xl rounded-full scale-150 animate-pulse" />
                    <img 
                      src="/logo/centrikaLogo.png" 
                      alt="Centrika Logo" 
                      className="h-14 w-auto relative z-10 drop-shadow-xl transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <CardTitle className="text-2xl leading-tight font-black text-[#1e40af] tracking-tight uppercase">Security <span className="text-[#fbbf24]">Reset</span></CardTitle>
                    <CardDescription className="text-[#1e40af]/40 font-bold text-[8px] uppercase tracking-[0.2em] leading-relaxed">Let's re-establish your secure credentials.</CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="px-8 pb-8">
                  <form onSubmit={handleResetPassword} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="new-password" className="text-[#1e40af] font-black text-[9px] uppercase tracking-[0.2em] pl-1 block">
                        New Security Phrase
                      </Label>
                      <div className="relative group/input">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1e40af]/30 group-focus-within/input:text-[#1e40af] transition-colors duration-300">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lock"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        </div>
                        <Input
                          id="new-password"
                          type="password"
                          placeholder="••••••••"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="h-12 !bg-white border-[#1e40af]/5 pl-11 text-sm text-black placeholder:text-[#1e40af]/20 focus:!bg-white focus:border-[#1e40af]/30 focus:ring-4 focus:ring-[#1e40af]/5 transition-all duration-300 font-bold rounded-xl shadow-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="text-[#1e40af] font-black text-[9px] uppercase tracking-[0.2em] pl-1 block">
                        Verify New Phrase
                      </Label>
                      <div className="relative group/input">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1e40af]/30 group-focus-within/input:text-[#1e40af] transition-colors duration-300">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield-check"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>
                        </div>
                        <Input
                          id="confirm-password"
                          type="password"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="h-12 !bg-white border-[#1e40af]/5 pl-11 text-sm text-black placeholder:text-[#1e40af]/20 focus:!bg-white focus:border-[#1e40af]/30 focus:ring-4 focus:ring-[#1e40af]/5 transition-all duration-300 font-bold rounded-xl shadow-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="p-3.5 bg-[#1e40af]/5 border border-[#1e40af]/10 rounded-xl text-center">
                      <p className="text-[9px] font-black text-[#1e40af]/40 uppercase tracking-widest leading-relaxed">
                        For enhanced protocol security, ensure your phrase is complex and at least <span className="text-[#1e40af]">6 characters</span> long.
                      </p>
                    </div>

                    <div className="space-y-4 pt-2">
                      <Button
                        type="submit"
                        disabled={isResetting}
                        className="w-full h-12 bg-[#1e40af] hover:bg-[#1e3a8a] text-white font-black tracking-[0.2em] uppercase text-[10px] shadow-xl shadow-[#1e40af]/20 transition-all duration-500 hover:scale-[1.01] active:scale-[0.99] rounded-xl group/btn"
                      >
                        {isResetting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Update Security Phrase"
                        )}
                      </Button>

                      <Button
                        type="button"
                        onClick={() => navigate("/login")}
                        variant="ghost"
                        className="w-full h-10 text-[#1e40af]/30 hover:text-[#1e40af] hover:bg-transparent font-black uppercase tracking-[0.2em] text-[10px] transition-all duration-300 group/back"
                      >
                        <ArrowLeft className="mr-2 h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
                        Return to Login
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </>
            )}
          </Card>
        </div>
      </div>

      {/* Footer - Always bottom */}
      <div className="relative z-10 py-4 text-center text-[#1e40af]/50 text-[10px] font-black tracking-[0.2em] uppercase">
        <p>OnePortal Secure Digital Environment</p>
        <p>© 2026 Centrika Ltd • Access Strictly Controlled</p>
      </div>
    </div>
  );
}
