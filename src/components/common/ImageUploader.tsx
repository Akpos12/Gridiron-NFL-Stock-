import React, { useState, useRef } from "react";
import { Upload, X, RefreshCw, Image as ImageIcon, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "../../lib/utils";

interface ImageUploaderProps {
  value: string;
  onChange: (imageUrl: string) => void;
  label?: string;
  placeholder?: string;
  aspectRatio?: "square" | "portrait" | "landscape" | "banner";
  className?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  label = "Upload Image",
  placeholder = "Select or drop image from device",
  aspectRatio = "square",
  className = ""
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compress image client-side to web-optimized data URL
  const processImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPG, PNG, WEBP)");
      return;
    }

    // Limit to max 15MB before compression
    if (file.size > 15 * 1024 * 1024) {
      setError("File size exceeds 15MB. Please choose a smaller image.");
      return;
    }

    setError(null);
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let maxDim = 1200;
        if (aspectRatio === "square") maxDim = 800;
        if (aspectRatio === "portrait") maxDim = 900;
        
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Compress to JPEG with 0.82 quality for high visual quality & low byte size
          const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
          onChange(dataUrl);
          setIsUploading(false);
        } else {
          // Fallback to original data URL if canvas context fails
          onChange(e.target?.result as string);
          setIsUploading(false);
        }
      };

      img.onerror = () => {
        setError("Failed to decode image file");
        setIsUploading(false);
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      setError("Error reading file from device");
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

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

  const getAspectClass = () => {
    switch (aspectRatio) {
      case "square": return "aspect-square";
      case "portrait": return "aspect-[3/4]";
      case "landscape": return "aspect-[16/9]";
      case "banner": return "aspect-[21/9]";
      default: return "aspect-square";
    }
  };

  return (
    <div className={cn("space-y-2 text-left", className)}>
      {label && (
        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center justify-between">
          <span>{label}</span>
          {value && <span className="text-[9px] text-emerald-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Image Loaded</span>}
        </label>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.png,.jpg,.jpeg,.webp,.heic,.heif"
        onChange={handleFileChange}
        className="hidden"
      />

      {value ? (
        <div className="relative group rounded-2xl overflow-hidden border border-white/10 bg-zinc-950 shadow-xl">
          <div className={cn("w-full overflow-hidden flex items-center justify-center bg-zinc-900/80", getAspectClass())}>
            <img
              src={value}
              alt="Uploaded preview"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 p-4 backdrop-blur-xs">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-lg cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Change Photo
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-lg cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 bg-zinc-950/60 hover:bg-zinc-900/60 hover:border-blue-500/50 group",
            dragActive ? "border-blue-500 bg-blue-500/10" : "border-white/10"
          )}
        >
          <div className="w-12 h-12 rounded-full bg-zinc-900 group-hover:bg-blue-600/20 border border-white/10 group-hover:border-blue-500/30 flex items-center justify-center transition-colors">
            {isUploading ? (
              <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
            ) : (
              <Upload className="w-5 h-5 text-zinc-400 group-hover:text-blue-400 transition-colors" />
            )}
          </div>

          <div>
            <p className="text-xs font-bold text-white uppercase tracking-tight">
              {isUploading ? "Optimizing image..." : "Choose Photo from Device"}
            </p>
            <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-1">
              {placeholder} (JPG, PNG, WEBP)
            </p>
          </div>

          <button
            type="button"
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all mt-1"
          >
            Browse Files
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-rose-400 text-[10px] font-bold uppercase tracking-wider mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
