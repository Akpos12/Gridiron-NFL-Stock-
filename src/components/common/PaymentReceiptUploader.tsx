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
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  ZoomIn,
  Sparkles
} from "lucide-react";
import { cn } from "../../lib/utils";

export interface PaymentReceiptUploaderProps {
  value?: string;
  values?: string[];
  onChange?: (dataUrl: string) => void;
  onValuesChange?: (dataUrls: string[]) => void;
  label?: string;
  required?: boolean;
  className?: string;
  subtitle?: string;
  description?: string;
  maxFiles?: number;
}

export const PaymentReceiptUploader: React.FC<PaymentReceiptUploaderProps> = ({
  value,
  values,
  onChange,
  onValuesChange,
  label = "Attach Payment Screenshot or Receipt",
  required = false,
  className = "",
  subtitle,
  description,
  maxFiles = 6
}) => {
  const displaySubtitle = subtitle || description || "Upload your transaction screenshot, banking receipt, or transfer proof";
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  // Initialize internal images state from values or value prop
  const parseInitialImages = (): string[] => {
    if (values && values.length > 0) {
      return values.filter(Boolean);
    }
    if (value) {
      if (typeof value === "string" && value.startsWith("[") && value.endsWith("]")) {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) return parsed.filter(Boolean);
        } catch {
          // fall through
        }
      }
      return [value];
    }
    return [];
  };

  const [images, setImages] = useState<string[]>(parseInitialImages);

  // Keep images state synced if props change externally
  useEffect(() => {
    if (values !== undefined) {
      setImages(values.filter(Boolean));
    } else if (value !== undefined) {
      if (!value) {
        setImages([]);
      } else if (value.startsWith("[") && value.endsWith("]")) {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) setImages(parsed.filter(Boolean));
          else setImages([value]);
        } catch {
          setImages([value]);
        }
      } else {
        setImages([value]);
      }
    }
  }, [value, values]);

  // Separate refs for standard device photo gallery / file selector vs live camera capture
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Compress & encode image client-side to highly compact data URL (< 60KB string)
  // Ensures multiple receipt pictures can safely reside inside a single Firestore document (< 1MB document limit)
  const processSingleFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith("image/") && !/\.(png|jpe?g|webp|heic|heif)$/i.test(file.name)) {
        return reject(new Error(`"${file.name}" is not a recognized image format.`));
      }

      if (file.size > 25 * 1024 * 1024) {
        return reject(new Error(`"${file.name}" exceeds 25MB limit.`));
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          try {
            // Helper to generate JPEG at specific dimension and quality
            const generateCompressed = (maxDim: number, quality: number): string => {
              const canvas = document.createElement("canvas");
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

              canvas.width = Math.max(1, width);
              canvas.height = Math.max(1, height);
              const ctx = canvas.getContext("2d");
              if (!ctx) return "";

              // Crisp white background for transparent PNG/HEIC receipts
              ctx.fillStyle = "#FFFFFF";
              ctx.fillRect(0, 0, width, height);
              ctx.drawImage(img, 0, 0, width, height);
              return canvas.toDataURL("image/jpeg", quality);
            };

            // Progressive compression: targets <= 55-60KB data URL string
            // Step 1: 800px max dimension at 0.65 quality (clean, crisp text for receipts)
            let result = generateCompressed(800, 0.65);

            // Step 2: If still > 70KB, reduce to 640px at 0.55 quality
            if (result.length > 70_000) {
              result = generateCompressed(640, 0.55);
            }

            // Step 3: If still > 60KB, reduce to 520px at 0.45 quality
            if (result.length > 60_000) {
              result = generateCompressed(520, 0.45);
            }

            // Step 4: Final fallback safeguard if image is very complex/noisy
            if (result.length > 55_000) {
              result = generateCompressed(420, 0.40);
            }

            resolve(result || (e.target?.result as string));
          } catch (canvasErr) {
            console.warn("Canvas compression fallback:", canvasErr);
            resolve(e.target?.result as string);
          }
        };

        img.onerror = () => reject(new Error(`Failed to decode image "${file.name}".`));
        img.src = e.target?.result as string;
      };

      reader.onerror = () => reject(new Error(`Error reading file "${file.name}".`));
      reader.readAsDataURL(file);
    });
  };

  // Process multiple files (gallery multi-selection, multi-drop, or paste)
  const processFiles = async (fileList: FileList | File[], append = true) => {
    const rawFiles = Array.from(fileList);
    if (rawFiles.length === 0) return;

    setError(null);
    setIsProcessing(true);

    try {
      const processedUrls: string[] = [];
      for (const file of rawFiles) {
        try {
          const url = await processSingleFile(file);
          processedUrls.push(url);
        } catch (err: any) {
          console.warn("Failed to process file:", err);
          setError(err?.message || "Failed to process one or more images.");
        }
      }

      if (processedUrls.length > 0) {
        const currentList = append ? images : [];
        const nextImages = [...currentList, ...processedUrls].slice(0, maxFiles);
        setImages(nextImages);
        onChange?.(nextImages[0] || "");
        onValuesChange?.(nextImages);
      }
    } catch (err: any) {
      setError(err?.message || "An error occurred while processing pictures.");
    } finally {
      setIsProcessing(false);
      // Reset input values so same file can be reselected if needed
      if (galleryInputRef.current) galleryInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const nextImages = images.filter((_, idx) => idx !== indexToRemove);
    setImages(nextImages);
    onChange?.(nextImages[0] || "");
    onValuesChange?.(nextImages);

    if (previewIndex !== null) {
      if (nextImages.length === 0) {
        setPreviewIndex(null);
      } else if (previewIndex >= nextImages.length) {
        setPreviewIndex(nextImages.length - 1);
      }
    }
  };

  const handleClearAll = () => {
    setImages([]);
    onChange?.("");
    onValuesChange?.([]);
    setPreviewIndex(null);
  };

  // Clipboard paste listener (Ctrl+V / Cmd+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const items = e.clipboardData.items;
      const pastedFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          if (blob) pastedFiles.push(blob);
        }
      }
      if (pastedFiles.length > 0) {
        processFiles(pastedFiles, true);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [images]);

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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files, true);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files, true);
    }
  };

  return (
    <div className={cn("space-y-2 text-left", className)}>
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-300 flex items-center gap-1.5">
          <Camera className="w-3.5 h-3.5 text-blue-400" />
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {images.length > 0 && (
          <span className="text-[9px] font-black uppercase text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {images.length === 1 ? "1 Receipt Attached" : `${images.length} Pictures Attached`}
          </span>
        )}
      </div>

      {/* Hidden File Inputs - note 'multiple' attribute on gallery input */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*,.png,.jpg,.jpeg,.webp,.heic,.heif"
        multiple
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

      {images.length === 0 ? (
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
                {isProcessing ? "Processing Pictures..." : "Attach Payment Screenshot or Receipts"}
              </p>
              <p className="text-[9px] text-zinc-500 font-bold uppercase mt-0.5">
                {displaySubtitle}
              </p>
            </div>

            {/* Mobile & Desktop Action Buttons */}
            <div className="flex items-center justify-center gap-2 pt-1 flex-wrap w-full max-w-md">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  galleryInputRef.current?.click();
                }}
                className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Select Photos from Gallery</span>
                <span className="text-[8px] bg-blue-400/30 px-1.5 py-0.5 rounded font-mono">Multiple</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  cameraInputRef.current?.click();
                }}
                className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 hover:text-white border border-white/10 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-zinc-300" />
                <span>Take Photo</span>
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1 flex-wrap justify-center">
              <span className="px-2 py-0.5 rounded bg-zinc-900 border border-white/5 text-[8px] font-mono text-zinc-400">
                Select 1 or Multiple Pictures
              </span>
              <span className="text-zinc-600 text-[8px]">•</span>
              <span className="px-2 py-0.5 rounded bg-zinc-900 border border-white/5 text-[8px] font-mono text-zinc-400">
                Screenshots • JPG • PNG • WEBP
              </span>
              <span className="text-zinc-600 text-[8px]">•</span>
              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[8px] font-mono font-bold">
                Ctrl+V Paste supported
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Multi-Image Attached State */
        <div className="p-4 bg-zinc-950 rounded-2xl border border-emerald-500/30 space-y-3">
          {/* Header Bar */}
          <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2.5 flex-wrap">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-black uppercase text-white tracking-wide">
                  {images.length === 1 ? "1 Receipt Attached" : `${images.length} Receipt Pictures Attached`}
                </p>
                <p className="text-[9px] text-zinc-400 font-medium">
                  Select additional pictures or tap any photo to zoom and inspect.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                disabled={images.length >= maxFiles || isProcessing}
                className="px-2.5 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 hover:text-white text-[9px] font-black uppercase flex items-center gap-1 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="Add more pictures from gallery"
              >
                {isProcessing ? (
                  <RotateCcw className="w-3 h-3 animate-spin" />
                ) : (
                  <Plus className="w-3 h-3" />
                )}
                <span>Add More from Gallery</span>
              </button>

              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={images.length >= maxFiles || isProcessing}
                className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/5 text-[9px] font-black uppercase flex items-center gap-1 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="Take an additional photo with camera"
              >
                <Camera className="w-3.5 h-3.5 text-zinc-300" />
              </button>

              <button
                type="button"
                onClick={handleClearAll}
                className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white transition-all cursor-pointer"
                title="Clear all pictures"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive Thumbnails Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {images.map((imgUrl, idx) => (
              <div
                key={idx}
                className="relative rounded-xl overflow-hidden bg-zinc-900 border border-white/10 aspect-square group/thumb"
              >
                <img
                  src={imgUrl}
                  alt={`Receipt ${idx + 1}`}
                  className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform"
                />

                {/* Badge Number */}
                <div className="absolute top-1.5 left-1.5 bg-black/75 backdrop-blur-sm border border-white/10 text-white text-[8px] font-mono font-black px-1.5 py-0.5 rounded-md flex items-center gap-1">
                  <span>#{idx + 1}</span>
                  {idx === 0 && <span className="text-emerald-400">Main</span>}
                </div>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage(idx);
                  }}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-lg bg-black/75 hover:bg-rose-600 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-white/10"
                  title="Remove this picture"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                {/* Click to Enlarge / Inspect Overlay */}
                <div
                  onClick={() => {
                    setPreviewIndex(idx);
                    setIsZoomed(false);
                  }}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                >
                  <span className="px-2 py-1 bg-blue-600 text-white text-[9px] font-black uppercase rounded-lg shadow flex items-center gap-1">
                    <Eye className="w-3 h-3" /> Inspect
                  </span>
                </div>
              </div>
            ))}

            {/* Inline Add More Button Tile */}
            {images.length < maxFiles && (
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                disabled={isProcessing}
                className="border-2 border-dashed border-white/10 hover:border-blue-500/50 hover:bg-blue-600/5 rounded-xl aspect-square flex flex-col items-center justify-center gap-1.5 text-zinc-400 hover:text-white transition-all cursor-pointer"
              >
                <Plus className="w-5 h-5 text-blue-400" />
                <span className="text-[9px] font-black uppercase tracking-wider text-center px-1">
                  Add Photos
                </span>
              </button>
            )}
          </div>

          <div className="flex items-center justify-between text-[9px] text-zinc-500 font-mono pt-1">
            <span>{images.length} / {maxFiles} images attached</span>
            <span>Box Office review team will inspect all receipts</span>
          </div>
        </div>
      )}

      {error && (
        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Full Resolution Multi-Image Preview Modal */}
      {previewIndex !== null && images[previewIndex] && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative max-w-3xl w-full bg-zinc-900 border border-white/10 rounded-[2rem] p-5 sm:p-6 space-y-4 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-white">
                    Receipt Photo {previewIndex + 1} of {images.length}
                  </h4>
                  <p className="text-[9px] font-mono text-zinc-400">Use arrows to view all selected receipts</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsZoomed(!isZoomed)}
                  className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[9px] font-black uppercase flex items-center gap-1 transition-all cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>{isZoomed ? "Reset" : "Zoom"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveImage(previewIndex)}
                  className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white transition-all cursor-pointer"
                  title="Delete this photo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewIndex(null)}
                  className="p-1.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Main Picture View Area with Prev / Next Navigation */}
            <div className="relative flex-1 overflow-auto rounded-xl bg-zinc-950 border border-white/5 p-2 flex items-center justify-center min-h-[40vh]">
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewIndex((previewIndex - 1 + images.length) % images.length);
                      setIsZoomed(false);
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/70 hover:bg-blue-600 border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg"
                    title="Previous photo"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewIndex((previewIndex + 1) % images.length);
                      setIsZoomed(false);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/70 hover:bg-blue-600 border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg"
                    title="Next photo"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              <img
                src={images[previewIndex]}
                alt={`Receipt Preview ${previewIndex + 1}`}
                className={cn(
                  "object-contain rounded-lg shadow-lg transition-all",
                  isZoomed 
                    ? "max-w-none scale-150 my-10 cursor-zoom-out" 
                    : "max-w-full max-h-[55vh] cursor-zoom-in"
                )}
                onClick={() => setIsZoomed(!isZoomed)}
              />
            </div>

            {/* Thumbnails strip */}
            {images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
                {images.map((thumb, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPreviewIndex(idx);
                      setIsZoomed(false);
                    }}
                    className={cn(
                      "w-12 h-12 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer",
                      previewIndex === idx ? "border-blue-500 scale-105" : "border-white/10 opacity-60 hover:opacity-100"
                    )}
                  >
                    <img src={thumb} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
              <span>Ready for management verification in Control Room</span>
              <button
                type="button"
                onClick={() => setPreviewIndex(null)}
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
