"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import ActionSelector from "./ActionSelector";
import ClothingProgressPanel, {
  type ClothingPhase,
} from "./ClothingProgressPanel";
import PhotoComparison from "./PhotoComparison";
import PhotoScanOverlay from "./PhotoScanOverlay";
import PipelineProgressPanel from "./PipelineProgressPanel";
import SubjectPositionControls from "./SubjectPositionControls";
import SubjectTiltControls from "./SubjectTiltControls";
import {
  actionMap,
  DEFAULT_ACTION_KEY,
  DEFAULT_SUBJECT_POSITION,
  DEFAULT_SUBJECT_TILT,
  planAiPipeline,
  runPhotoAction,
  runPhotoActionPipeline,
  type ActionKey,
  type PhotoActionParams,
  type PipelinePlan,
  type PipelineProgress,
  type SubjectPosition,
  type SubjectTilt,
} from "@/lib/actions";
import {
  renderClothingFromFile,
  type ClothingRenderResult,
} from "@/lib/api/clothing";

type Status = "idle" | "scanning" | "preview" | "received";

const SCAN_ON_UPLOAD_MS = 2800;
const SCAN_ON_SEND_MS = 2400;

export default function PhotoUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clothingPhaseTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const previewRef = useRef<string | null>(null);
  const activeActionRef = useRef<ActionKey>(DEFAULT_ACTION_KEY);
  const actionParamsRef = useRef<PhotoActionParams>({});
  const [status, setStatus] = useState<Status>("idle");
  const [scanPhase, setScanPhase] = useState<"upload" | "send">("upload");
  const [activeAction, setActiveAction] =
    useState<ActionKey>(DEFAULT_ACTION_KEY);
  const [preview, setPreview] = useState<string | null>(null);
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [actionParams, setActionParams] = useState<PhotoActionParams>(
    () => actionMap[DEFAULT_ACTION_KEY].defaultParams ?? {},
  );
  const [pipelinePlan, setPipelinePlan] = useState<PipelinePlan | null>(null);
  const [pipelineMeta, setPipelineMeta] = useState<{
    pipelineSource: "openai" | "mock";
    planId: string;
    generatedAt: string;
  } | null>(null);
  const [pipelineProgress, setPipelineProgress] =
    useState<PipelineProgress | null>(null);
  const [pipelinePhase, setPipelinePhase] = useState<
    "analyzing" | "running" | "done" | null
  >(null);
  const [clothingResult, setClothingResult] =
    useState<ClothingRenderResult | null>(null);
  const [clothingPhase, setClothingPhase] = useState<ClothingPhase | null>(
    null,
  );
  const [clothingError, setClothingError] = useState<string | null>(null);

  const currentAction = actionMap[activeAction];
  const isAiPipeline = activeAction === "ai-auto-edit";
  const isClothingMode = activeAction === "clothing-cinematic";
  const isLongRunningMode = isAiPipeline || isClothingMode;

  useLayoutEffect(() => {
    previewRef.current = preview;
    activeActionRef.current = activeAction;
    actionParamsRef.current = actionParams;
  }, [preview, activeAction, actionParams]);

  const handleActionChange = useCallback((key: ActionKey) => {
    activeActionRef.current = key;
    setActiveAction(key);
    setActionParams(actionMap[key].defaultParams ?? {});
  }, []);

  const setSubjectPosition = (position: SubjectPosition) => {
    setActionParams((prev) => ({ ...prev, position }));
  };

  const setSubjectTilt = (tilt: SubjectTilt) => {
    setActionParams((prev) => ({ ...prev, tilt }));
  };

  const subjectPosition: SubjectPosition = {
    ...DEFAULT_SUBJECT_POSITION,
    ...actionParams.position,
  };

  const subjectTilt: SubjectTilt = {
    ...DEFAULT_SUBJECT_TILT,
    ...actionParams.tilt,
  };

  const showPositionControls =
    activeAction === "add-background" && !isAiPipeline;
  const showTiltControls = activeAction === "tilt-subject" && !isAiPipeline;

  const revokeProcessed = useCallback((url: string | null) => {
    if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
  }, []);

  const clearScanTimer = useCallback(() => {
    if (scanTimerRef.current) {
      clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
    }
  }, []);

  const clearClothingPhaseTimers = useCallback(() => {
    for (const id of clothingPhaseTimersRef.current) {
      clearTimeout(id);
    }
    clothingPhaseTimersRef.current = [];
  }, []);

  const startClothingPhaseTimers = useCallback(() => {
    clearClothingPhaseTimers();
    setClothingPhase("analyzing-style");
    clothingPhaseTimersRef.current = [
      setTimeout(() => setClothingPhase("generating"), 45_000),
    ];
  }, [clearClothingPhaseTimers]);

  const finishScan = useCallback(
    async (nextStatus: Status) => {
      const source = previewRef.current;
      const actionKey = activeActionRef.current;

      if (!source) {
        setStatus(nextStatus);
        return;
      }

      setIsGenerating(true);
      try {
        if (actionKey === "ai-auto-edit") {
          setPipelinePlan(null);
          setPipelineMeta(null);
          setPipelineProgress(null);
          setPipelinePhase("analyzing");

          const { plan, meta } = await planAiPipeline(source);
          setPipelinePlan(plan);
          setPipelineMeta(meta);
          setPipelinePhase("running");

          const { finalUrl } = await runPhotoActionPipeline(
            source,
            plan.actions,
            (progress) => setPipelineProgress(progress),
          );

          setProcessedPreview((prev) => {
            revokeProcessed(prev);
            return finalUrl;
          });
          setPipelinePhase("done");
        } else if (actionKey === "clothing-cinematic") {
          setClothingResult(null);
          setClothingError(null);
          startClothingPhaseTimers();

          const result = await renderClothingFromFile(source);
          clearClothingPhaseTimers();
          setClothingResult(result);
          setClothingPhase("done");
          setProcessedPreview((prev) => {
            revokeProcessed(prev);
            return result.outputUrl;
          });
        } else {
          const processed = await runPhotoAction(
            actionKey,
            source,
            actionParamsRef.current,
          );
          setProcessedPreview((prev) => {
            revokeProcessed(prev);
            return processed;
          });
        }
      } catch (err) {
        console.error(`Action "${actionKey}" failed:`, err);
        const message =
          err instanceof Error ? err.message : "Processing failed";
        if (actionKey === "clothing-cinematic") {
          setClothingError(message);
          clearClothingPhaseTimers();
          setClothingPhase(null);
        } else {
          setProcessedPreview(source);
          setPipelinePhase(null);
        }
      } finally {
        setIsGenerating(false);
        setStatus(nextStatus);
      }
    },
    [revokeProcessed, startClothingPhaseTimers, clearClothingPhaseTimers],
  );

  const startScan = useCallback(
    (phase: "upload" | "send", nextStatus: Status) => {
      clearScanTimer();
      setScanPhase(phase);
      setStatus("scanning");

      if (activeActionRef.current === "clothing-cinematic") {
        void finishScan(nextStatus);
        return;
      }

      const isAi = activeActionRef.current === "ai-auto-edit";
      const duration =
        phase === "upload"
          ? isAi
            ? 900
            : SCAN_ON_UPLOAD_MS
          : isAi
            ? 900
            : SCAN_ON_SEND_MS;
      scanTimerRef.current = setTimeout(() => {
        scanTimerRef.current = null;
        void finishScan(nextStatus);
      }, duration);
    },
    [clearScanTimer, finishScan],
  );

  useEffect(
    () => () => {
      clearScanTimer();
      clearClothingPhaseTimers();
    },
    [clearScanTimer, clearClothingPhaseTimers],
  );

  const handleFile = useCallback(
    (file: File | null) => {
      if (!file?.type.startsWith("image/")) return;

      setFileName(file.name);
      setProcessedPreview((prev) => {
        revokeProcessed(prev);
        return null;
      });
      setPipelinePlan(null);
      setPipelineMeta(null);
      setPipelineProgress(null);
      setPipelinePhase(null);
      setClothingResult(null);
      setClothingPhase(null);
      setClothingError(null);

      const url = URL.createObjectURL(file);
      previewRef.current = url;
      setPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
      startScan("upload", "preview");
    },
    [startScan, revokeProcessed],
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0] ?? null);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0] ?? null);
  };

  const onSubmit = () => {
    if (status !== "preview" || !preview) return;
    startScan("send", "received");
  };

  const onReprocess = () => {
    if (!preview) return;
    setProcessedPreview((prev) => {
      revokeProcessed(prev);
      return null;
    });
    startScan("upload", "preview");
  };

  const onReset = () => {
    clearScanTimer();
    if (preview) URL.revokeObjectURL(preview);
    revokeProcessed(processedPreview);
    setPreview(null);
    setProcessedPreview(null);
    setFileName("");
    setStatus("idle");
    setIsGenerating(false);
    setPipelinePlan(null);
    setPipelineMeta(null);
    setPipelineProgress(null);
    setPipelinePhase(null);
    setClothingResult(null);
    setClothingPhase(null);
    setClothingError(null);
    clearClothingPhaseTimers();
    if (inputRef.current) inputRef.current.value = "";
  };

  const showComparison =
    preview &&
    processedPreview &&
    (status === "preview" || status === "received");

  const scanLabel = isClothingMode
    ? clothingPhase === "generating"
      ? "GENERATING CINEMATIC SHOT"
      : clothingPhase === "analyzing-style"
        ? "MATCHING STYLE & COLORS"
        : "REMOVING BACKGROUND"
    : isAiPipeline
      ? pipelinePhase === "running"
        ? "RUNNING AI PIPELINE"
        : pipelinePhase === "done"
          ? "PIPELINE COMPLETE"
          : "AI ANALYZING IMAGE"
      : scanPhase === "send"
        ? "TRANSMITTING PHOTO"
        : currentAction.scanningLabel;

  if (status === "received" && showComparison) {
    return (
      <div className="w-full max-w-4xl space-y-8">
        <PhotoComparison
          original={preview}
          processed={processedPreview}
          processedLabel={
            isClothingMode ? "Cinematic shot" : currentAction.label
          }
          fileName={fileName}
          showTransparencyGrid={activeAction === "clear-background"}
        />

        {isClothingMode && clothingResult && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="mb-3 text-center text-xs font-medium uppercase tracking-wider text-white/40">
              Original photo (sent to Replicate)
            </p>
            <div className="mx-auto max-w-xs overflow-hidden rounded-xl ring-1 ring-white/10 processed-checkerboard">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={clothingResult.sourceImageUrl}
                alt="Source clothing photo"
                className="h-auto w-full object-contain"
              />
            </div>
          </div>
        )}

        {isClothingMode && clothingResult && (
          <ClothingProgressPanel phase="done" result={clothingResult} />
        )}

        <div className="flex flex-col items-center rounded-3xl border border-emerald-500/30 bg-linear-to-br from-emerald-950/40 to-teal-950/20 px-8 py-10 text-center shadow-2xl shadow-emerald-900/20">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 ring-2 ring-emerald-400/50">
            <svg
              className="h-8 w-8 text-emerald-400"
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
          <h2 className="text-2xl font-semibold tracking-tight text-emerald-100">
            Photo Received
          </h2>
          <p className="mt-2 text-sm text-emerald-200/70">
            {currentAction.label} complete — your processed image is ready.
          </p>
          <button
            type="button"
            onClick={onReset}
            className="mt-8 rounded-full bg-white/10 px-8 py-3 text-sm font-medium text-white transition hover:bg-white/20"
          >
            Upload another
          </button>
        </div>
      </div>
    );
  }

  if (status === "scanning" && preview) {
    return (
      <div
        className={`w-full space-y-4 ${isLongRunningMode ? "max-w-4xl" : "max-w-lg"}`}
      >
        <PhotoScanOverlay
          key={`${scanPhase}-${activeAction}-${pipelinePhase ?? clothingPhase ?? "idle"}`}
          preview={preview}
          fileName={fileName}
          label={scanLabel}
        />
        {isAiPipeline && (
          <PipelineProgressPanel
            plan={pipelinePlan}
            progress={pipelineProgress}
            phase={pipelinePhase ?? "analyzing"}
            meta={pipelineMeta}
          />
        )}
        {isClothingMode && clothingPhase && (
          <ClothingProgressPanel
            phase={clothingPhase}
            result={clothingResult}
            error={clothingError}
          />
        )}
        <p className="text-center text-xs text-white/40">
          Running: {currentAction.label}
          {isClothingMode ? " — original photo + prompt → Replicate (2–5 min)" : ""}
          {isGenerating ? " — processing…" : ""}
        </p>
      </div>
    );
  }

  if (status === "preview" && showComparison) {
    return (
      <div className="w-full max-w-4xl space-y-6">
        <PhotoComparison
          original={preview}
          processed={processedPreview}
          processedLabel={
            isClothingMode
              ? "Cinematic shot"
              : isAiPipeline
                ? "AI Enhanced"
                : currentAction.label
          }
          fileName={fileName}
          showTransparencyGrid={activeAction === "clear-background"}
        />

        {isClothingMode && clothingResult && (
          <>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="mb-3 text-center text-xs font-medium uppercase tracking-wider text-white/40">
                Cutout used for generation
              </p>
              <div className="mx-auto max-w-sm overflow-hidden rounded-xl ring-1 ring-white/10 processed-checkerboard">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={clothingResult.sourceImageUrl}
                  alt="Source clothing photo"
                  className="h-auto w-full object-contain"
                />
              </div>
            </div>
            <ClothingProgressPanel phase="done" result={clothingResult} />
          </>
        )}

        {isAiPipeline && pipelinePlan && (
          <PipelineProgressPanel
            plan={pipelinePlan}
            progress={pipelineProgress}
            phase="done"
            meta={pipelineMeta}
          />
        )}

        {showPositionControls && (
          <SubjectPositionControls
            value={subjectPosition}
            onChange={setSubjectPosition}
            disabled={isGenerating}
          />
        )}

        {showTiltControls && (
          <SubjectTiltControls
            value={subjectTilt}
            onChange={setSubjectTilt}
            disabled={isGenerating}
          />
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onReset}
            className="flex-1 rounded-2xl border border-white/15 py-3.5 text-sm font-medium text-white/80 transition hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onReprocess}
            disabled={isGenerating}
            className="flex-1 rounded-2xl border border-cyan-400/30 py-3.5 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/10 disabled:opacity-50"
          >
            Reprocess
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isGenerating}
            className="flex-1 rounded-2xl bg-linear-to-r from-violet-500 to-fuchsia-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:opacity-90 hover:shadow-violet-500/40 disabled:opacity-50"
          >
            Send photo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg space-y-6">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onInputChange}
      />

      <ActionSelector value={activeAction} onChange={handleActionChange} />

      {showPositionControls && (
        <SubjectPositionControls
          value={subjectPosition}
          onChange={setSubjectPosition}
        />
      )}

      {showTiltControls && (
        <SubjectTiltControls value={subjectTilt} onChange={setSubjectTilt} />
      )}

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
        <div className="flex min-h-[280px] flex-col items-center justify-center px-8 py-12 text-center">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-violet-500/80 to-fuchsia-500/80 shadow-lg shadow-violet-500/25">
            <svg
              className="h-7 w-7 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
          </div>
          <p className="text-lg font-medium text-white">Drop your photo here</p>
          <p className="mt-2 text-sm text-white/50">
            {currentAction.description}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full rounded-2xl bg-linear-to-r from-violet-500 to-fuchsia-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:opacity-90"
      >
        Choose from device
      </button>
    </div>
  );
}
