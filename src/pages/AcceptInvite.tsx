import { useParams, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { trpc } from "../lib/trpc";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AcceptInvite() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [, navigate] = useLocation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invitationData, setInvitationData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const verifyToken = trpc.invitations.verifyInvitationToken.useQuery(
    { token: token || "" },
    {
      enabled: !!token,
      onSuccess: (data) => {
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

  const acceptInvitation = trpc.invitations.acceptInvitation.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create account");
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verifying your invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invitation Expired or Invalid</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-4">{error}</p>
            <p className="text-gray-600 mb-6">
              Please contact your HR department to request a new invitation.
            </p>
            <Button
              onClick={() => navigate("/login")}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="text-center mb-4">
            <img
              src="/logo/centrikaLogo.png"
              alt="Centrika Logo"
              className="h-16 w-auto mx-auto"
            />
          </div>
          <CardTitle className="text-center">Complete Your Account Setup</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <p className="text-gray-600 text-sm mb-2">
              Welcome, <strong>{invitationData?.name}</strong>!
            </p>
            <p className="text-gray-600 text-sm">
              Please set a password to activate your Centrika OnePortal account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <Input
                type="email"
                value={invitationData?.email || ""}
                disabled
                className="bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <Input
                type="text"
                value={invitationData?.role || ""}
                disabled
                className="bg-gray-100 capitalize"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <Input
                type="password"
                placeholder="Enter password (min 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 mt-1">
                Use a mix of letters, numbers, and symbols for security
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <Input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <p className="text-xs text-gray-500 text-center mt-4">
            This link is valid for 7 days. After that, please contact your HR department for a new invitation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
