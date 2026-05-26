"use client";

import { ENABLE_LEGACY_TOOLS } from "@/lib/config/features";
import GenerationStudio from "./GenerationStudio";
import PhotoUpload from "./PhotoUpload";

/** Main studio: generation presets by default; legacy tools when enabled. */
export default function Studio() {
  if (ENABLE_LEGACY_TOOLS) {
    return <PhotoUpload />;
  }
  return <GenerationStudio />;
}
