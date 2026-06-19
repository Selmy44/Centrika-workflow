import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface PasswordInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  className?: string;
  required?: boolean;
  autoComplete?: string;
}

export function PasswordInput({
  label,
  value,
  onChange,
  placeholder = "Enter password",
  id = "password",
  className,
  required = false,
  autoComplete = "password",
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor={id} className="text-[9px] font-black text-[#3b6dae]/60 uppercase tracking-widest pl-0.5">
          {label}
          {required && <span className="text-rose-500 ml-1 font-black">*</span>}
        </Label>
      )}
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          className="h-9 bg-white border-[#3b6dae]/10 focus:border-[#3b6dae]/30 focus:ring-0 rounded-lg font-bold text-xs shadow-none transition-all pr-10"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3b6dae]/30 hover:text-[#3b6dae]/80 transition-colors focus:outline-none"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOff className="w-3.5 h-3.5" />
          ) : (
            <Eye className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
