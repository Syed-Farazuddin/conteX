"use client";

import ComparisonImageFrame from "./ComparisonImageFrame";

type PhotoComparisonProps = {
  original: string;
  processed: string;
  processedLabel?: string;
  fileName?: string;
  compact?: boolean;
  showTransparencyGrid?: boolean;
  enableActions?: boolean;
};

function buildDownloadName(fileName: string | undefined, suffix: string) {
  if (!fileName) return `contex-${suffix}.jpg`;
  const base = fileName.replace(/\.[^.]+$/, "");
  return `${base}-${suffix}.jpg`;
}

export default function PhotoComparison({
  original,
  processed,
  processedLabel = "Processed",
  fileName,
  compact = false,
  showTransparencyGrid = false,
  enableActions = true,
}: PhotoComparisonProps) {
  return (
    <div
      className={`comparison-reveal w-full ${compact ? "" : "rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-6"}`}
    >
      {!compact && fileName && (
        <p className="mb-4 truncate text-center font-mono text-xs text-white/40">
          {fileName}
        </p>
      )}

      <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-[1fr_auto_1fr] sm:gap-3">
        <ComparisonImageFrame
          src={original}
          alt="Original upload"
          label="Original"
          downloadName={buildDownloadName(fileName, "original")}
          enableActions={enableActions}
        />

        <div className="comparison-arrow flex items-center justify-center py-2 sm:py-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-r from-cyan-500/20 to-violet-500/20 ring-1 ring-cyan-400/30 sm:h-12 sm:w-12">
            <svg
              className="h-5 w-5 text-cyan-300 sm:rotate-0 rotate-90"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </div>
        </div>

        <ComparisonImageFrame
          src={processed}
          alt="Processed result"
          label={processedLabel}
          downloadName={buildDownloadName(fileName, "generated")}
          imageClassName="h-full w-full object-contain"
          containerClassName={
            showTransparencyGrid ? "processed-checkerboard" : "bg-black/40"
          }
          captionClassName="border-b border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-center text-xs font-medium uppercase tracking-wider text-cyan-300/90"
          ringClassName="ring-1 ring-cyan-400/30"
          enableActions={enableActions}
          overlay={
            <div className="pointer-events-none absolute inset-0 bg-linear-to-tr from-cyan-500/10 via-transparent to-violet-500/10" />
          }
        />
      </div>
    </div>
  );
}
