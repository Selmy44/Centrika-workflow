import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Home, AlertCircle } from "lucide-react";

export default function NotFoundPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-blue-100 rounded-full blur-2xl opacity-50 animate-pulse"></div>
          <AlertCircle size={120} className="relative text-blue-600 mx-auto" strokeWidth={1.5} />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-8xl font-black text-slate-900 tracking-tighter">404</h1>
          <h2 className="text-2xl font-bold text-slate-800">Page Not Found</h2>
          <p className="text-slate-500">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            onClick={() => setLocation("/")}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 h-12 px-8 rounded-xl shadow-lg shadow-blue-500/20"
          >
            <Home size={18} />
            Back to Dashboard
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.history.back()}
            size="lg"
            className="h-12 px-8 rounded-xl border-slate-200"
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
