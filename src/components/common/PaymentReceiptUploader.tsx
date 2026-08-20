import React, { useState, useRef, useEffect } from "react";
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  FileCheck, 
  Camera, 
  RotateCcw,
  Sparkles
} from "lucide-react";
import { cn } from "../../lib/utils";

interface PaymentReceiptUploaderProps {
  value: string;
  onChange: (dataUrl: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
  subtitle?: string;
  description?: string;
}

export const PaymentReceiptUploader: React.FC<PaymentReceiptUploaderProps> = ({
  value,
  onChange,
  label = "Attach Payment Screenshot or Receipt",
  required = false,
  className = "",
  subtitle,
  description
}) => {
  const displaySubtitle = subtitle || description || "Upload your transaction screenshot, banking receipt, or transfer proof";
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
  // Separate refs for standard device photo gallery / file selector vs live camera capture
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Compress & encode image client-side to optimized data URL (< 600KB)
  const processImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (PNG, JPG, JPEG, WEBP, or HEIC).");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError("File size exceeds 20MB. Please take a smaller screenshot.");
      return;
    }

    setError(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDimension = 1400; // ample resolution to read transaction reference numbers & dates
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          onChange(dataUrl);
          setIsProcessing(false);
        } else {
          onChange(e.target?.result as string);
          setIsProcessing(false);
        }
      };

      img.onerror = () => {
        setError("Failed to decode screenshot. Please try a different image.");
        setIsProcessing(false);
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      setError("Error reading file from device.");
      setIsProcessing(false);
    };

    reader.readAsDataURL(file);
  };

  // Clipboard paste listener (Ctrl+V / Cmd+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            processImageFile(blob);
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  return (
    <div className={cn("space-y-2 text-left", className)}>
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-300 flex items-center gap-1.5">
          <Camera className="w-3.5 h-3.5 text-blue-400" />
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {value && (
          <span className="text-[9px] font-black uppercase text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Receipt Attached
          </span>
        )}
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*,.png,.jpg,.jpeg,.webp,.heic,.heif"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {!value ? (
        <div
          ref={containerRef}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            "relative group border-2 border-dashed rounded-2xl p-5 text-center transition-all select-none",
            dragActive 
              ? "border-blue-500 bg-blue-600/10 scale-[1.01]" 
              : "border-white/10 hover:border-blue-500/50 bg-zinc-950/70 hover:bg-zinc-900/60"
          )}
        >
          <div className="flex flex-col items-center justify-center space-y-3">
            <div 
              onClick={() => galleryInputRef.current?.click()}
              className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform cursor-pointer group-hover:scale-110",
                dragActive ? "bg-blue-600 text-white" : "bg-zinc-900 text-blue-400 border border-white/5"
              )}
            >
              {isProcessing ? (
                <RotateCcw className="w-5 h-5 animate-spin text-blue-400" />
              ) : (
                <Upload className="w-5 h-5 text-blue-400" />
              )}
            </div>

            <div onClick={() => galleryInputRef.current?.click()} className="cursor-pointer">
              <p className="text-xs font-black uppercase tracking-wide text-white">
                {isProcessing ? "Processing Screenshot..." : "Attach Payment Screenshot or Receipt"}
              </p>
              <p className="text-[9px] text-zinc-500 font-bold uppercase mt-0.5">
                {displaySubtitle}
              </p>
            </div>

            {/* Mobile & Desktop Action Buttons */}
            <div className="flex items-center justify-center gap-2 pt-1 flex-wrap w-full max-w-sm">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  galleryInputRef.current?.click();
                }}
                className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Photo Gallery / Photos</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  cameraInputRef.current?.click();
                }}
                className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 hover:text-white border border-white/10 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-zinc-300" />
                <span>Take Photo</span>
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span className="px-2 py-0.5 rounded bg-zinc-900 border border-white/5 text-[8px] font-mono text-zinc-400">
                Screenshots • JPG • PNG • WEBP • HEIC
              </span>
              <span className="text-zinc-600 text-[8px]">•</span>
              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[8px] font-mono font-bold">
                Ctrl+V / Paste supported
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative p-3 bg-zinc-950 rounded-2xl border border-emerald-500/30 flex items-center justify-between gap-3 group">
          <div className="flex items-center gap-3 min-w-0">
            <div 
              onClick={() => setShowPreviewModal(true)}
              className="relative w-16 h-16 rounded-xl overflow-hidden bg-zinc-900 border border-white/10 shrink-0 cursor-pointer group/thumb"
            >
              <img 
                src={value} 
                alt="Payment Receipt" 
                className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform" 
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                <Eye className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <p className="text-xs font-black uppercase text-white truncate">
                  Payment Proof Attached
                </p>
              </div>
              <p className="text-[9px] text-zinc-400 font-medium mt-0.5">
                Management will review this receipt to confirm your ticket.
              </p>
              <button
                type="button"
                onClick={() => setShowPreviewModal(true)}
                className="text-[9px] font-black uppercase text-blue-400 hover:text-blue-300 mt-1 inline-flex items-center gap-1 cursor-pointer"
              >
                <Eye className="w-3 h-3" /> View Full Screenshot
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/5 text-[9px] font-black uppercase flex items-center gap-1 transition-all cursor-pointer"
              title="Replace receipt from photo gallery"
            >
              <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Gallery</span>
            </button>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/5 text-[9px] font-black uppercase flex items-center gap-1 transition-all cursor-pointer"
              title="Take a new photo with camera"
            >
              <Camera className="w-3.5 h-3.5 text-zinc-300" />
              <span className="hidden sm:inline">Camera</span>
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white transition-all cursor-pointer"
              title="Remove receipt"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Full Resolution Preview Modal */}
      {showPreviewModal && value && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative max-w-2xl w-full bg-zinc-900 border border-white/10 rounded-[2rem] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-black uppercase tracking-wider text-white">Payment Receipt / Screenshot Inspection</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto rounded-xl bg-zinc-950 border border-white/5 p-2 flex items-center justify-center">
              <img
                src={value}
                alt="Payment Receipt Large Preview"
                className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-lg"
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
              <span>Ready for management verification in Control Room</span>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-wider rounded-xl cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
