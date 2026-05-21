"use client";

import { useCallback, useRef, useState } from "react";

type Status = "idle" | "preview" | "received";

export default function PhotoUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback((file: File | null) => {
    if (!file?.type.startsWith("image/")) return;

    setFileName(file.name);
    const url = URL.createObjectURL(file);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    setStatus("preview");
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0] ?? null);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0] ?? null);
  };

  const onSubmit = () => {
    if (status !== "preview") return;
    setStatus("received");
  };

  const onReset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFileName("");
    setStatus("idle");
    if (inputRef.current) inputRef.current.value = "";
  };

  if (status === "received") {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-emerald-500/30 bg-linear-to-br from-emerald-950/40 to-teal-950/20 px-8 py-16 text-center shadow-2xl shadow-emerald-900/20">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 ring-2 ring-emerald-400/50">
          <svg
            className="h-10 w-10 text-emerald-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-3xl font-semibold tracking-tight text-emerald-100">
          Photo Received
        </h2>
        <p className="mt-3 max-w-sm text-emerald-200/70">
          Your image has been uploaded successfully.
          {fileName && (
            <span className="mt-2 block font-mono text-sm text-emerald-300/80">
              {fileName}
            </span>
          )}
        </p>
        <button
          type="button"
          onClick={onReset}
          className="mt-10 rounded-full bg-white/10 px-8 py-3 text-sm font-medium text-white transition hover:bg-white/20"
        >
          Upload another
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onInputChange}
      />

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onClick={() => status === "idle" && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`relative overflow-hidden rounded-3xl border-2 border-dashed transition-all duration-300 ${
          isDragging
            ? "border-violet-400 bg-violet-500/10 scale-[1.01]"
            : "border-white/20 bg-white/5 hover:border-white/35 hover:bg-white/[0.07]"
        }`}
      >
        {preview ? (
          <div className="relative aspect-4/3 w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Preview"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
            <p className="absolute bottom-4 left-4 right-4 truncate text-sm text-white/90">
              {fileName}
            </p>
          </div>
        ) : (
          <div className="flex min-h-[280px] flex-col items-center justify-center px-8 py-12 text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/30">
              <svg
                className="h-8 w-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2 8.798 2 10.5V18a2 2 0 002 2h16a2 2 0 002-2v-7.5c0-1.702-1-2.922-2.052-3.095-.377-.063-.754-.12-1.134-.175a2.31 2.31 0 01-1.64-1.055L15 5.186M12 13.5V6m0 0L9.75 8.25M12 6l2.25 2.25"
                />
              </svg>
            </div>
            <p className="text-lg font-medium text-white">
              Drop your photo here
            </p>
            <p className="mt-2 text-sm text-white/50">
              or click to browse · PNG, JPG, WEBP
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 flex gap-3">
        {status === "preview" ? (
          <>
            <button
              type="button"
              onClick={onReset}
              className="flex-1 rounded-2xl border border-white/15 py-3.5 text-sm font-medium text-white/80 transition hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSubmit}
              className="flex-1 rounded-2xl bg-linear-to-r from-violet-500 to-fuchsia-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:opacity-90 hover:shadow-violet-500/40"
            >
              Send photo
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full rounded-2xl bg-linear-to-r from-violet-500 to-fuchsia-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:opacity-90"
          >
            Choose from device
          </button>
        )}
      </div>
    </div>
  );
}
