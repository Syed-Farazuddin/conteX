import { fetchPipelinePlan, blobUrlToBase64 } from "@/lib/api/pipeline";
import type {
  PipelineActionKey,
  PipelinePlan,
  PipelineProgress,
  PipelineStep,
} from "@/lib/api/pipeline-types";
import { isActionKey, runPhotoAction } from "./index";

export type { PipelinePlan, PipelineStep, PipelineProgress };

function isPipelineActionKey(key: string): key is PipelineActionKey {
  return isActionKey(key) && key !== "ai-auto-edit";
}

function revokeIfBlob(url: string) {
  if (url.startsWith("blob:")) URL.revokeObjectURL(url);
}

/** Ask OpenAI (via backend) which actions to run on this image. */
export async function planAiPipeline(imageUrl: string): Promise<PipelinePlan> {
  const base64 = await blobUrlToBase64(imageUrl);
  const plan = await fetchPipelinePlan(base64);

  const actions = plan.actions
    .filter((step): step is PipelineStep => isPipelineActionKey(step.action))
    .filter(
      (step) =>
        step.action !== "tilt-subject" ||
        !plan.actions.some((s) => s.action === "add-background"),
    );
  if (actions.length === 0) {
    throw new Error("AI returned no valid actions");
  }

  return { ...plan, actions };
}

/** Run each action in order; output of step N feeds step N+1. */
export async function runPhotoActionPipeline(
  sourceUrl: string,
  steps: PipelineStep[],
  onProgress?: (progress: PipelineProgress) => void,
): Promise<{ finalUrl: string; completed: PipelineStep[] }> {
  let currentUrl = sourceUrl;
  const ownedUrls = new Set<string>();
  const completed: PipelineStep[] = [];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    onProgress?.({
      stepIndex: i,
      total: steps.length,
      current: step,
      completed: [...completed],
    });

    const nextUrl = await runPhotoAction(step.action, currentUrl, step.params);

    if (currentUrl !== sourceUrl && ownedUrls.has(currentUrl)) {
      revokeIfBlob(currentUrl);
      ownedUrls.delete(currentUrl);
    }

    if (nextUrl !== currentUrl) {
      ownedUrls.add(nextUrl);
    }

    currentUrl = nextUrl;
    completed.push(step);
  }

  onProgress?.({
    stepIndex: steps.length,
    total: steps.length,
    current: steps[steps.length - 1],
    completed: [...completed],
  });

  return { finalUrl: currentUrl, completed };
}
