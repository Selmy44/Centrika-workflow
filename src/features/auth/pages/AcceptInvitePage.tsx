import { useParams, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AcceptInvitePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [, navigate] = useLocation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invitationData, setInvitationData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const verifyToken = (trpc as any).invitations.verifyInvitationToken.useQuery(
    { token: token || "" },
    {
      enabled: !!token,
      onSuccess: (data: any) => {
        if (data.valid) {
          setInvitationData(data);
          setError(null);
        } else {
          setError(data.message || "Invalid invitation link");
        }
        setIsLoading(false);
      },
      onError: () => {
        setError("Failed to verify invitation");
        setIsLoading(false);
      },
    }
  );

  const acceptInvitation = (trpc as any).invitations.acceptInvitation.useMutation({
    onSuccess: (data: any) => {
      toast.success(data.message);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
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

            {isLoading ? (
              <CardContent className="py-16 flex flex-col items-center justify-center text-center">
                <div className="relative scale-75">
                  <div className="absolute inset-0 bg-[#1e40af]/5 blur-xl rounded-full scale-150 animate-pulse" />
                  <Loader2 className="h-10 w-10 animate-spin text-[#1e40af] relative z-10" strokeWidth={2.5} />
                </div>
                <p className="mt-4 text-[8px] font-black text-[#1e40af]/30 uppercase tracking-[0.3em] animate-pulse">
                  Verifying Business Invitation...
                </p>
              </CardContent>
            ) : error ? (
              <>
                <CardHeader className="space-y-3 pt-6 pb-2 px-8 text-center border-none">
                  <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20 scale-75">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-circle text-red-500"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                  </div>
                  <div className="space-y-0.5">
                    <CardTitle className="text-2xl leading-tight font-black text-[#1e40af] tracking-tight uppercase">Invitation <span className="text-red-500">Expired</span></CardTitle>
                    <CardDescription className="text-[#1e40af]/40 font-bold text-[8px] uppercase tracking-[0.2em] leading-relaxed">
                      {error}. Please contact your Department Head or Corporate Registry to request a fresh invitation link.
                    </CardDescription>
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
                      className="h-14 w-auto relative z-10 drop-shadow-xl duration-700 transition-transform group-hover:scale-105"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <CardTitle className="text-2xl leading-tight font-black text-[#1e40af] tracking-tight uppercase">Setup your <span className="text-[#fbbf24]">Access</span></CardTitle>
                    <CardDescription className="text-[#1e40af]/40 font-bold text-[8px] uppercase tracking-[0.2em] leading-relaxed">
                      Welcome, <strong>{invitationData?.name}</strong>. Let's secure your official business posture.
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[9px] font-black text-[#1e40af] uppercase tracking-[0.2em] pl-1">
                          Portal ID
                        </label>
                        <Input
                          type="email"
                          value={invitationData?.email || ""}
                          disabled
                          className="h-10 !bg-[#1e40af]/5 border-none text-[#1e40af] font-bold rounded-lg text-[11px]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[9px] font-black text-[#1e40af] uppercase tracking-[0.2em] pl-1">
                          Assigned Role
                        </label>
                        <Input
                          type="text"
                          value={invitationData?.role || ""}
                          disabled
                          className="h-10 !bg-[#1e40af]/5 border-none text-[#1e40af] font-bold rounded-lg capitalize text-[11px]"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" title="password" className="text-[9px] font-black text-[#1e40af] uppercase tracking-[0.2em] pl-1 block">
                        New Security Phrase
                      </Label>
                      <div className="relative group/input">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1e40af]/30 group-focus-within/input:text-[#1e40af] transition-colors duration-300">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lock"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        </div>
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={isSubmitting}
                          className="h-12 !bg-white border-[#1e40af]/5 pl-11 text-sm text-black placeholder:text-[#1e40af]/20 focus:!bg-white focus:border-[#1e40af]/30 focus:ring-4 focus:ring-[#1e40af]/5 transition-all duration-300 font-bold rounded-xl shadow-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" title="confirm-password" className="text-[9px] font-black text-[#1e40af] uppercase tracking-[0.2em] pl-1 block">
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
                          disabled={isSubmitting}
                          className="h-12 !bg-white border-[#1e40af]/5 pl-11 text-sm text-black placeholder:text-[#1e40af]/20 focus:!bg-white focus:border-[#1e40af]/30 focus:ring-4 focus:ring-[#1e40af]/5 transition-all duration-300 font-bold rounded-xl shadow-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-12 bg-[#1e40af] hover:bg-[#1e3a8a] text-white font-black tracking-[0.2em] uppercase text-[10px] shadow-xl shadow-[#1e40af]/20 transition-all duration-500 hover:scale-[1.01] active:scale-[0.99] rounded-xl group/btn"
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
                        ) : (
                          "Activate My Security Profile"
                        )}
                      </Button>
                    </div>

                    <p className="text-[8px] font-black text-[#1e40af]/20 text-center uppercase tracking-[0.3em] leading-relaxed mt-4">
                      This protocol link is temporary. If entry fails, contact the Corporate Helpdesk for a re-dispatch.
                    </p>
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

