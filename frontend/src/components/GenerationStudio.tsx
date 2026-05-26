"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PhotoComparison from "./PhotoComparison";
import StyleSelector from "./StyleSelector";
import {
  fetchGenerationStyles,
  generateFromFile,
  type GenerationResult,
  type GenerationStyle,
} from "@/lib/api/generate";

type Status = "idle" | "uploading" | "preview" | "generating";

const DEFAULT_STYLE_ID = "natural";

export default function GenerationStudio() {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);

  const [status, setStatus] = useState<Status>("idle");
  const [styles, setStyles] = useState<GenerationStyle[]>([]);
  const [apiReady, setApiReady] = useState(false);
  const [styleId, setStyleId] = useState(DEFAULT_STYLE_ID);
  const [preview, setPreview] = useState<string | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");

  useEffect(() => {
    fetchGenerationStyles()
      .then(({ configured, styles: list }) => {
        setApiReady(configured);
        setStyles(list);
        if (list.length && !list.some((s) => s.id === styleId)) {
          setStyleId(list[0]!.id);
        }
      })
      .catch(() => setApiReady(false));
  }, [styleId]);

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    setError(null);
    setResult(null);
    setOutputUrl(null);
    setFileName(file.name);
    const url = URL.createObjectURL(file);
    if (previewRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(previewRef.current);
    }
    previewRef.current = url;
    setPreview(url);
    setStatus("preview");
  }, []);

  const handleGenerate = useCallback(async () => {
    const source = previewRef.current;
    if (!source) return;

    setStatus("generating");
    setError(null);

    try {
      const data = await generateFromFile(source, styleId, {
        ...(customPrompt.trim() ? { prompt: customPrompt.trim() } : {}),
      });
      setResult(data);
      setOutputUrl(data.outputUrl);
      setStatus("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
      setStatus("preview");
    }
  }, [styleId, customPrompt]);

  const selectedStyle = styles.find((s) => s.id === styleId);

  return (
    <div className="w-full max-w-lg space-y-5">
      {!apiReady && (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Add <code className="text-amber-200">REPLICATE_API_TOKEN</code> to{" "}
          <code className="text-amber-200">backend/.env</code> and restart the
          API.
        </p>
      )}

      <div>
        <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-white/35">
          Choose a style
        </p>
        {styles.length > 0 ? (
          <StyleSelector
            styles={styles}
            value={styleId}
            onChange={setStyleId}
            disabled={status === "generating"}
          />
        ) : (
          <p className="text-sm text-white/40">Loading styles…</p>
        )}
      </div>

      <label className="block">
        <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-widest text-white/35">
          Extra prompt (optional)
        </span>
        <textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          disabled={status === "generating"}
          placeholder="Add details, e.g. sunset lighting, smiling…"
          rows={2}
          className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-violet-400/40 focus:outline-none disabled:opacity-50"
        />
      </label>

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) loadFile(file);
        }}
        onClick={() => inputRef.current?.click()}
        className={`relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 transition ${
          isDragging
            ? "border-violet-400/60 bg-violet-500/10"
            : "border-white/15 bg-white/3 hover:border-white/25 hover:bg-white/5"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) loadFile(file);
          }}
        />
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Upload preview"
            className="max-h-48 rounded-lg object-contain"
          />
        ) : (
          <>
            <p className="text-4xl opacity-60">↑</p>
            <p className="mt-2 text-sm font-medium text-white/80">
              Tap or drop a photo
            </p>
            <p className="mt-1 text-xs text-white/40">
              {selectedStyle
                ? `Generate in ${selectedStyle.label} style`
                : "Pick a style above"}
            </p>
          </>
        )}
      </div>

      {fileName && (
        <p className="truncate text-center text-xs text-white/40">{fileName}</p>
      )}

      {preview && (
        <button
          type="button"
          disabled={!apiReady || status === "generating"}
          onClick={handleGenerate}
          className="w-full rounded-2xl bg-linear-to-r from-violet-500 to-fuchsia-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:opacity-95 disabled:opacity-40"
        >
          {status === "generating"
            ? `Generating ${selectedStyle?.label ?? "image"}…`
            : `Generate ${selectedStyle?.label ?? "image"}`}
        </button>
      )}

      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      {result && preview && outputUrl && (
        <div className="space-y-4">
          <PhotoComparison
            original={preview}
            processed={outputUrl}
            processedLabel={result.styleLabel}
            fileName={fileName}
          />
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/50">
            <p>
              <span className="text-white/35">Style:</span> {result.styleLabel}
            </p>
            <p className="mt-1 line-clamp-3">
              <span className="text-white/35">Prompt:</span> {result.prompt}
            </p>
          </div>
          <a
            href={outputUrl}
            target="_blank"
            rel="noreferrer"
            className="block text-center text-sm text-violet-300 hover:text-violet-200"
          >
            Open full image ↗
          </a>
        </div>
      )}
    </div>
  );
}
