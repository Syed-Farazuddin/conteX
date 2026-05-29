"use client";

import { useState, type ReactNode } from "react";
import { downloadImage } from "@/lib/download-image";
import ImageLightbox from "./ImageLightbox";

type ComparisonImageFrameProps = {
  src: string;
  alt: string;
  label: string;
  downloadName: string;
  imageClassName?: string;
  containerClassName?: string;
  captionClassName?: string;
  ringClassName?: string;
  overlay?: ReactNode;
  enableActions?: boolean;
};

function ImageOverlayButton({
  label,
  onClick,
  disabled,
  children,
  className,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={`flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white transition hover:bg-black/80 disabled:cursor-wait disabled:opacity-70 ${className}`}
    >
      {children}
    </button>
  );
}

export default function ComparisonImageFrame({
  src,
  alt,
  label,
  downloadName,
  imageClassName = "h-full w-full object-cover",
  containerClassName = "bg-black/40",
  captionClassName = "border-b border-white/10 bg-white/5 px-3 py-2 text-center text-xs font-medium uppercase tracking-wider text-white/50",
  ringClassName = "ring-1 ring-white/10",
  overlay,
  enableActions = true,
}: ComparisonImageFrameProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      await downloadImage(src, downloadName);
    } catch {
      window.open(src, "_blank", "noopener,noreferrer");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <figure
        className={`comparison-card flex flex-col overflow-hidden rounded-2xl ${ringClassName}`}
      >
        <figcaption className={captionClassName}>{label}</figcaption>
        <div className={`relative aspect-4/3 ${containerClassName}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} className={imageClassName} />
          {overlay}
          {enableActions && (
            <>
              <ImageOverlayButton
                label="View full screen"
                className="absolute right-2 top-2"
                onClick={() => setLightboxOpen(true)}
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5h-4m4 0v-4m0 4l-5-5"
                  />
                </svg>
              </ImageOverlayButton>
              <ImageOverlayButton
                label="Download image"
                className="absolute bottom-2 right-2"
                disabled={downloading}
                onClick={() => void handleDownload()}
              >
                {downloading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
                    />
                  </svg>
                )}
              </ImageOverlayButton>
            </>
          )}
        </div>
      </figure>

      {lightboxOpen && (
        <ImageLightbox
          src={src}
          alt={alt}
          title={label}
          downloadName={downloadName}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}
