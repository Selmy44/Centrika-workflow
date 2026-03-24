import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import OtpVerification from "./OtpVerificationPage";

export default function Login() {
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [showOtpPage, setShowOtpPage] = useState(false);
  const [currentEmail, setCurrentEmail] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [cardVisible, setCardVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const utils = trpc.useUtils();
  const login = trpc.auth.login.useMutation();
  const devLoginMutation = trpc.auth.devLogin.useMutation();

  useEffect(() => {
    const timer = setTimeout(() => setCardVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

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
  };~

  const handleDevLogin = async (role: "user" | "admin" | "hr" | "head_of_department" | "head_of_finance" | "ceo_md") => {
    try {
      toast.loading("Signing in...");
      await devLoginMutation.mutateAsync({ role });
      await utils.auth.me.invalidate();
      toast.dismiss();
      toast.success(`Signed in as ${role.replace(/_/g, " ")}!`);
      navigate("/");
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to sign in");
    }
  };

  if (showOtpPage) {
    return (
      <OtpVerification
        email={currentEmail}
        onBack={() => {
          setShowOtpPage(false);
          setCurrentEmail("");
        }}
      />
    );
  }

  return (
    <div
      ref={scrollRef}
      className="login-page min-h-screen w-full overflow-hidden relative"
      style={{ background: "#f7f9fc" }}
    >
      {/* Force light mode on login page */}
      <style>{`
        .login-page, .login-page * {
          color-scheme: light !important;
        }
        .login-page .dark\\:bg-slate-950,
        .login-page .dark\\:bg-slate-900,
        .login-page .dark\\:bg-slate-800,
        .login-page .dark\\:text-white,
        .login-page .dark\\:text-slate-100,
        .login-page .dark\\:text-slate-200,
        .login-page .dark\\:text-slate-300,
        .login-page .dark\\:text-slate-400,
        .login-page .dark\\:border-slate-700,
        .login-page .dark\\:border-slate-600 {
          all: revert;
        }
        @media (max-width: 768px) {
          .login-left-panel { display: none !important; }
          .login-divider { display: none !important; }
          .login-right-panel {
            width: 100% !important;
            position: relative !important;
            min-height: 100vh;
          }
        }
      `}</style>

      {/* ====== LEFT: Background Image with Blue Overlay ====== */}
      <div className="login-left-panel absolute left-0 top-0 h-full" style={{ width: "45%" }}>
        {/* Photo */}
        <img
          src="/logo/loginbackground2G.jpeg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Blue overlay using system blue #3b6dae */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(160deg, rgba(30, 64, 120, 0.92) 0%, rgba(59, 109, 174, 0.82) 50%, rgba(59, 109, 174, 0.65) 100%)",
          }}
        />

        {/* Decorative circles */}
        <div className="absolute top-[12%] left-[10%] w-24 h-24 rounded-full border border-white/10" />
        <div className="absolute top-[28%] left-[18%] w-6 h-6 rounded-full bg-white/8" />
        <div className="absolute bottom-[22%] left-[6%] w-16 h-16 rounded-full border border-white/8" />
        <div className="absolute bottom-[40%] right-[10%] w-10 h-10 rounded-full bg-white/5" />

        {/* Branding content */}
        <div className="relative z-10 h-full flex flex-col justify-center px-12">
          <div className="mb-8">
            <div className="inline-block rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)" }}>
              <img
                src="/logo/centrikaLogo.png"
                alt="Centrika"
                className="h-32 w-auto drop-shadow-xl"
              />
            </div>
          </div>
          <h1
            className="text-4xl font-bold text-white mb-3 leading-tight"
            style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", letterSpacing: "-0.02em" }}
          >
            Centrika OnePortal
          </h1>
          <p className="text-blue-100/90 text-lg mb-10 max-w-sm leading-relaxed">
            Your unified workspace for managing requests, approvals and team collaboration.
          </p>
          <div className="space-y-3">
            {[
              "Streamlined leave & expense management",
              "Real-time approval tracking",
              "Secure role-based access",
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full" style={{ background: "#60b5f5" }} />
                <span className="text-blue-50/80 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ====== DIAGONAL DIVIDER ====== */}
      <div className="login-divider absolute top-0 h-full z-10" style={{ left: "40%", width: "200px" }}>
        <svg
          viewBox="0 0 200 100"
          preserveAspectRatio="none"
          className="h-full w-full"
          style={{ display: "block" }}
        >
          {/* Angled divider — clean diagonal with a subtle curve */}
          <polygon points="0,0 120,0 80,100 0,100" style={{ fill: "rgba(59, 109, 174, 0.82)" }} />
          <polygon points="120,0 200,0 200,100 80,100" fill="#f7f9fc" />
        </svg>
      </div>

      {/* ====== RIGHT: Login Form Panel ====== */}
      <div
        className="login-right-panel absolute right-0 top-0 h-full z-20 flex items-center justify-center"
        style={{ width: "55%", background: "#f7f9fc" }}
      >
        <div
          className={`w-full max-w-md px-12 transition-all duration-700 ease-out ${cardVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
        >
          {/* Welcome */}
          <div className="mb-8">
            <h2
              className="text-3xl font-semibold mb-1"
              style={{ color: "#1e3a5f", fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
            >
              Welcome 👋
            </h2>
            <p style={{ color: "#8ca0b8", fontSize: "14px" }}>
              Log in to your account to continue
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleEmailLogin} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                style={{ color: "#5a7a99", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}
              >
                Email
              </Label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                  style={{ color: "#9bb5cc" }}
                />
                <Input
                  id="email"
                  type="email"
                  placeholder="username@centrika.rw"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{
                    paddingLeft: "40px",
                    height: "48px",
                    background: "#eef3f8",
                    border: "1px solid #d4dfe9",
                    borderRadius: "10px",
                    color: "#1e3a5f",
                    fontSize: "14px",
                  }}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                style={{ color: "#5a7a99", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}
              >
                Password
              </Label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                  style={{ color: "#9bb5cc" }}
                />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  style={{
                    paddingLeft: "40px",
                    paddingRight: "44px",
                    height: "48px",
                    background: "#eef3f8",
                    border: "1px solid #d4dfe9",
                    borderRadius: "10px",
                    color: "#1e3a5f",
                    fontSize: "14px",
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "#9bb5cc" }}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  style={{ color: "#3b6dae", fontSize: "12px", fontWeight: 500 }}
                  className="hover:underline"
                >
                  Forgot your password?
                </button>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-full text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, #3b6dae 0%, #2a8fd4 100%)",
                border: "none",
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Log In"
              )}
            </Button>

            {/* Footer */}
            <p className="text-center text-xs pt-2" style={{ color: "#8ca0b8" }}>
              Don't have an account?{" "}
              <span
                className="font-medium cursor-pointer hover:underline"
                style={{ color: "#3b6dae" }}
              >
                Contact HR
              </span>
            </p>
          </form>

          {/* Bottom copyright */}
          <div className="mt-8 pt-6" style={{ borderTop: "1px solid #e8eef4" }}>
            <p className="text-center text-xs" style={{ color: "#b0c4d8" }}>
              Centrika OnePortal &middot; © 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
