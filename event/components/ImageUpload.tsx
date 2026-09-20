"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { browserSupabase } from "@/lib/supabase";

const BUCKET = "covers";
const MAX_BYTES = 8 * 1024 * 1024;

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
}

export default function ImageUpload({
  value,
  onChange,
  label = "Cover image",
  hint = "JPG or PNG, up to 8MB"
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError("");

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("That image is larger than 8MB.");
      return;
    }

    setUploading(true);
    try {
      const supabase = browserSupabase();
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: "3600",
        upsert: false
      });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (e: any) {
      setError(e?.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <label className="text-sm font-medium text-bone/70">{label}</label>
        <span className="text-xs text-bone/35">{hint}</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {value ? (
        <div className="group relative overflow-hidden rounded-2xl border border-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Cover preview" className="h-56 w-full object-cover" />
          <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/70 via-black/0 to-black/0 p-4 opacity-0 transition group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-lg bg-white/90 px-3.5 py-2 text-xs font-semibold text-ink-950"
            >
              Replace image
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="grid h-8 w-8 place-items-center rounded-lg bg-black/50 text-white/80 hover:text-white"
              aria-label="Remove image"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
          disabled={uploading}
          className={`flex h-56 w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition ${
            dragOver ? "border-brass-400/60 bg-brass-500/[.06]" : "border-white/12 bg-white/[.02] hover:border-white/25"
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="animate-spin text-brass-400" size={26} />
              <span className="text-sm text-bone/50">Uploading…</span>
            </>
          ) : (
            <>
              <span className="grid h-12 w-12 place-items-center rounded-full bg-white/[.05]">
                <ImagePlus size={20} className="text-brass-400" />
              </span>
              <span className="text-sm font-medium text-bone/70">Choose an image from your device</span>
              <span className="text-xs text-bone/35">or drag and drop it here</span>
            </>
          )}
        </button>
      )}

      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
    </div>
  );
}
