"use client";

type PhotoScanOverlayProps = {
  preview: string;
  fileName: string;
  label?: string;
};

export default function PhotoScanOverlay({
  preview,
  fileName,
  label = "SCANNING IMAGE",
}: PhotoScanOverlayProps) {
  return (
    <div className="scan-stage relative flex min-h-[320px] flex-col items-center justify-center overflow-hidden rounded-3xl border border-cyan-400/40 bg-black/80 shadow-[0_0_60px_rgba(34,211,238,0.15)]">
      <div className="scan-ambient pointer-events-none absolute inset-0" />

      <div className="scan-viewport relative mx-auto aspect-4/3 w-full max-w-md p-6">
        <div className="scan-rotate-ring absolute inset-4 rounded-2xl border border-dashed border-cyan-400/30" />

        <div className="scan-rotate-wrapper relative h-full w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Scanning"
            className="scan-image-rotate h-full w-full rounded-2xl object-cover shadow-2xl ring-2 ring-cyan-400/50"
          />

          <div className="scan-grid pointer-events-none absolute inset-0 rounded-2xl" />
          <div className="scan-line-h pointer-events-none absolute inset-x-0 top-0 h-1 rounded-full" />
          <div className="scan-line-v pointer-events-none absolute inset-y-0 left-0 w-1 rounded-full" />
          <div className="scan-shimmer pointer-events-none absolute inset-0 rounded-2xl" />
          <div className="scan-flash pointer-events-none absolute inset-0 rounded-2xl" />

          <span className="scan-corner scan-corner-tl" />
          <span className="scan-corner scan-corner-tr" />
          <span className="scan-corner scan-corner-bl" />
          <span className="scan-corner scan-corner-br" />
        </div>
      </div>

      <div className="relative z-10 mt-6 flex flex-col items-center gap-3 px-6 pb-8">
        <p className="scan-label font-mono text-sm font-bold tracking-[0.35em] text-cyan-300">
          {label}
        </p>
        <p className="max-w-xs truncate text-center text-xs text-cyan-200/50">
          {fileName}
        </p>
        <div className="scan-progress-bar h-1 w-48 overflow-hidden rounded-full bg-cyan-950">
          <div className="scan-progress-fill h-full rounded-full bg-linear-to-r from-cyan-400 via-violet-400 to-fuchsia-400" />
        </div>
      </div>
    </div>
  );
}
