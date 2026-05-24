import type { ActionKey } from "@/lib/actions/types";

/** Actions the AI pipeline can execute (excludes meta actions). */
export type PipelineActionKey = Exclude<ActionKey, "ai-auto-edit">;

export type PipelineStep = {
  action: PipelineActionKey;
  params?: import("@/lib/actions/types").PhotoActionParams;
  reason?: string;
};

export type PipelinePlan = {
  summary: string;
  actions: PipelineStep[];
};

export type PipelineProgress = {
  stepIndex: number;
  total: number;
  current: PipelineStep;
  completed: PipelineStep[];
};
