"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, Image as ImageIcon, X, Check, Loader2, Link as LinkIcon, Plus } from "lucide-react";
import { uploadSingleImageApi, uploadMultipleImagesApi } from "@/services/media-service";

export interface ImageUploadDropzoneProps {
  label?: string;
  helperText?: string;
  value?: string | string[];
  onChange?: (urls: string | string[]) => void;
  multiple?: boolean;
  maxFiles?: number;
  className?: string;
  aspectRatio?: "square" | "video" | "wide";
}

export const ImageUploadDropzone: React.FC<ImageUploadDropzoneProps> = ({
  label = "Upload Images",
  helperText = "PNG, JPG, WEBP or GIF (Max 10MB each)",
  value,
  onChange,
  multiple = false,
  maxFiles = 6,
  className = "",
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrl, setCustomUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Normalize current images into an array
  const currentImages: string[] = Array.isArray(value)
    ? value.filter(Boolean)
    : value
    ? [value]
    : [];

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (fileArray.length === 0) return;

    setIsUploading(true);
    try {
      if (multiple) {
        const availableSlots = maxFiles - currentImages.length;
        const toUpload = fileArray.slice(0, availableSlots);
        const uploadedUrls = await uploadMultipleImagesApi(toUpload);
        const combined = [...currentImages, ...uploadedUrls];
        onChange?.(combined);
      } else {
        const singleUrl = await uploadSingleImageApi(fileArray[0]);
        onChange?.(singleUrl);
      }
    } catch (err) {
      console.error("Failed to upload image(s)", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemoveImage = (indexToRemove: number) => {
    if (multiple) {
      const updated = currentImages.filter((_, idx) => idx !== indexToRemove);
      onChange?.(updated);
    } else {
      onChange?.("");
    }
  };

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;

    if (multiple) {
      onChange?.([...currentImages, customUrl.trim()]);
    } else {
      onChange?.(customUrl.trim());
    }
    setCustomUrl("");
    setShowUrlInput(false);
  };

  return (
    <div className={`space-y-2 text-xs ${className}`}>
      {/* Label & URL toggle bar */}
      <div className="flex items-center justify-between">
        {label && <label className="font-semibold text-brand-slate-800">{label}</label>}
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[11px] text-brand-emerald-800 hover:text-brand-emerald-900 font-medium flex items-center gap-1"
        >
          <LinkIcon className="w-3 h-3" />
          <span>{showUrlInput ? "Back to File Upload" : "Or paste direct URL"}</span>
        </button>
      </div>

      {/* Manual URL Input dropdown if toggled */}
      {showUrlInput && (
        <form onSubmit={handleAddUrl} className="flex gap-2 p-2 bg-brand-slate-50 rounded-xl border border-brand-slate-200">
          <input
            type="url"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="https://images.unsplash.com/photo-..."
            className="flex-1 px-3 py-1.5 text-xs bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-emerald-700/20"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-brand-emerald-800 text-white rounded-lg text-xs font-semibold hover:bg-brand-emerald-900"
          >
            Add
          </button>
        </form>
      )}

      {/* Main Drag & Drop Zone */}
      {(!multiple && currentImages.length > 0) ? (
        /* Single Image Preview Banner */
        <div className="relative group rounded-xl border border-brand-slate-200 overflow-hidden bg-brand-slate-50 p-2 flex items-center gap-3">
          <div className="w-20 h-20 bg-white rounded-lg border border-brand-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
            <img
              src={currentImages[0]}
              alt="Uploaded file preview"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
              <Check className="w-3 h-3 text-emerald-600" />
              Image Loaded
            </span>
            <p className="text-[11px] text-brand-slate-400 truncate mt-1">
              {currentImages[0].startsWith("data:") ? "Direct file upload" : currentImages[0]}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1.5 bg-white border border-brand-slate-200 hover:bg-brand-slate-100 rounded-lg text-xs font-medium text-brand-slate-700"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => handleRemoveImage(0)}
              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Interactive Dropzone */
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-brand-emerald-700 bg-emerald-50/60 scale-[0.99]"
              : "border-brand-slate-300 hover:border-brand-emerald-700 bg-brand-slate-50/50 hover:bg-brand-slate-50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple={multiple}
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
            }}
          />

          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-brand-slate-200 flex items-center justify-center text-brand-emerald-800">
              {isUploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <UploadCloud className="w-5 h-5" />
              )}
            </div>
            <div>
              <p className="font-semibold text-brand-slate-800">
                {isUploading ? "Processing and uploading..." : "Click to browse or drag & drop image"}
              </p>
              <p className="text-[11px] text-brand-slate-400 mt-0.5">{helperText}</p>
            </div>
          </div>
        </div>
      )}

      {/* Multiple Images Gallery Grid */}
      {multiple && currentImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 pt-2">
          {currentImages.map((url, idx) => (
            <div key={idx} className="relative group rounded-xl border border-brand-slate-200 bg-white overflow-hidden aspect-square">
              <img src={url} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
              
              {/* Primary badge for first image */}
              {idx === 0 && (
                <span className="absolute top-1 left-1 bg-brand-emerald-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                  Primary
                </span>
              )}

              {/* Remove button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage(idx);
                }}
                className="absolute top-1 right-1 bg-rose-600 text-white p-1 rounded-full shadow-xs hover:bg-rose-700 transition-colors"
                title="Remove photo"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {/* Add more button if slots remain */}
          {currentImages.length < maxFiles && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-brand-slate-300 hover:border-brand-emerald-700 rounded-xl flex flex-col items-center justify-center text-brand-slate-500 hover:text-brand-emerald-800 transition-colors aspect-square bg-brand-slate-50/50"
            >
              <Plus className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-semibold">Add More</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
