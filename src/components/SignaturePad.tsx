"use client";

import React, { useRef, useState, useEffect } from "react";
import { Eraser, Check, Type } from "lucide-react";
import { Button } from "./ui/button";

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  onClear: () => void;
  height?: number;
  className?: string;
}

export function SignaturePad({ onSave, onClear, height = 150, className = "" }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set drawing styles
    ctx.strokeStyle = "#3b6dae"; // Centrika blue
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Handle responsiveness
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        // Save current content if any
        let temp: ImageData | null = null;
        if (hasContent) {
          temp = ctx.getImageData(0, 0, canvas.width, canvas.height);
        }

        canvas.width = parent.clientWidth;
        canvas.height = height;

        // Restore styles after resize
        ctx.strokeStyle = "#3b6dae";
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        if (temp) {
             // We can't really restore perfectly on scale change without a path list,
             // but for a signature pad, clearing on resize is often acceptable 
             // or we can just leave it. Drawing a background grid helps.
        }
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [hasContent]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ("touches" in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ("touches" in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setHasContent(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ("touches" in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ("touches" in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas && hasContent) {
      onSave(canvas.toDataURL("image/png"));
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasContent(false);
    onClear();
  };

  return (
    <div className={`space-y-3 w-full animate-in fade-in slide-in-from-top-2 duration-300 ${className}`}>
      <div className="relative group bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-blue-200 dark:border-blue-900/50 overflow-hidden transition-all hover:border-blue-400 dark:hover:border-blue-700">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="cursor-crosshair w-full block"
          style={{ touchAction: "none" }}
        />
        
        {/* Helper grid/hint */}
        {!hasContent && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
             <div className="flex flex-col items-center gap-2">
                <Type className="w-8 h-8 text-blue-300" />
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Sign Your Name Here</p>
             </div>
          </div>
        )}

        <div className="absolute bottom-2 right-2 flex gap-2">
           <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={clear}
                className="h-8 rounded-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur border-slate-200 dark:border-slate-700 text-slate-500 hover:text-red-500 hover:border-red-200 transition-all font-bold text-[10px] uppercase tracking-widest"
           >
             <Eraser className="w-3 h-3 mr-1.5" /> Clear
           </Button>
        </div>
      </div>
      
      <div className="flex items-center gap-2 px-1">
         <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
         <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Electronic Signature Enabled</p>
      </div>
    </div>
  );
}
