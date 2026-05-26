import Replicate from "replicate";
import { config } from "../config/index.js";

export type ReplicateRunOptions = {
  /** Model identifier, e.g. `owner/name` or `owner/name:version` */
  model?: string;
  input: Record<string, unknown>;
  /**
   * Hint for how long the prediction may run (ms).
   * Only affects the initial `Prefer: wait=` header (capped at 60s by Replicate);
   * the client still polls until the job finishes.
   */
  timeoutMs?: number;
};

/** Replicate requires `Prefer: wait` between 1 and 60 (seconds). */
function replicatePreferWaitSeconds(timeoutMs?: number): number {
  const seconds = Math.ceil((timeoutMs ?? 60_000) / 1000);
  return Math.min(60, Math.max(1, seconds));
}

export class ReplicateService {
  private client: Replicate | null = null;

  isConfigured(): boolean {
    return Boolean(config.replicateApiToken);
  }

  private getClient(): Replicate {
    if (!config.replicateApiToken) {
      throw new Error("REPLICATE_API_TOKEN is not set in environment");
    }

    if (!this.client) {
      this.client = new Replicate({
        auth: config.replicateApiToken,
        fileEncodingStrategy: "upload",
      });
    }

    return this.client;
  }

  /**
   * Run a Replicate model and wait for the result.
   * @see https://replicate.com/docs/get-started/nodejs
   */
  async run(options: ReplicateRunOptions): Promise<unknown> {
    const model = options.model ?? config.replicateDefaultModel;
    if (!model.includes(":")) {
      throw new Error(
        `Replicate model "${model}" must be pinned as owner/name:version (unpinned names 404). ` +
          "Set REPLICATE_BG_MODEL (and other REPLICATE_*_MODEL vars) in backend/.env — see .env.example.",
      );
    }
    const client = this.getClient();

    return client.run(model as `${string}/${string}`, {
      input: options.input,
      wait: {
        mode: "block",
        timeout: replicatePreferWaitSeconds(options.timeoutMs),
      },
    });
  }

  /** Accept HTTPS URL, data URL, or raw base64. */
  normalizeImageInput(image: string): string {
    const trimmed = image.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }
    if (trimmed.startsWith("data:")) {
      return trimmed;
    }
    return `data:image/jpeg;base64,${trimmed}`;
  }

  /** Run the configured background-removal model on an image URL or base64. */
  async removeBackground(image: string): Promise<string> {
    const output = await this.run({
      model: config.replicateBgModel,
      input: { image: this.normalizeImageInput(image) },
      timeoutMs: 180_000,
    });

    const url = this.extractUrl(output);
    if (!url) {
      throw new Error("Replicate background removal returned no image URL");
    }

    return url;
  }

  /** Normalize Replicate output to a public HTTPS URL when possible. */
  extractUrl(output: unknown): string | null {
    if (typeof output === "string" && output.startsWith("http")) {
      return output;
    }

    if (Array.isArray(output)) {
      for (const item of output) {
        const url = this.extractUrl(item);
        if (url) return url;
      }
      return null;
    }

    if (output && typeof output === "object") {
      const record = output as Record<string, unknown>;

      // Replicate SDK FileOutput: output.url() => URL, output.toString() => https URL
      if (typeof record.url === "function") {
        try {
          const href = (record.url as () => URL)().href;
          if (href.startsWith("http")) return href;
        } catch {
          /* fall through */
        }
      }

      if (typeof record.url === "string" && record.url.startsWith("http")) {
        return record.url;
      }

      if (typeof record.toString === "function") {
        const asString = String(output);
        if (asString.startsWith("http")) return asString;
      }
    }

    return null;
  }
}

export const replicateService = new ReplicateService();
