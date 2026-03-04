import { forwardRef, useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  length?: number;
  placeholder?: string;
}

export const OtpInput = forwardRef<HTMLInputElement, OtpInputProps>(
  ({ value, onChange, disabled = false, length = 6, placeholder = "000000" }, ref) => {
    const [displayValue, setDisplayValue] = useState("");
    const innerRef = useRef<HTMLInputElement>(null);
    const inputRef = ref || innerRef;

    useEffect(() => {
      const handlePaste = (e: ClipboardEvent) => {
        e.preventDefault();
        const pastedText = e.clipboardData?.getData("text") || "";
        const digits = pastedText.replace(/\D/g, "").slice(0, length);
        onChange(digits);
      };

      const input = typeof inputRef === "object" ? inputRef?.current : null;
      input?.addEventListener("paste", handlePaste);
      return () => input?.removeEventListener("paste", handlePaste);
    }, [onChange, length, inputRef]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value.replace(/\D/g, "").slice(0, length);
      onChange(inputValue);
      setDisplayValue(inputValue);
    };

    return (
      <Input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        maxLength={length}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className="text-center text-4xl tracking-widest font-mono bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-400 focus:ring-blue-400/20"
      />
    );
  }
);

OtpInput.displayName = "OtpInput";
