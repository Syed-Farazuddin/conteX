import OpenAI from "openai";
import { config } from "../config/index.js";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ChatOptions = {
  model?: string;
  temperature?: number;
  maxTokens?: number;
};

export class AiService {
  private client: OpenAI | null = null;

  isConfigured(): boolean {
    return Boolean(config.openAiApiKey);
  }

  private getClient(): OpenAI {
    if (!config.openAiApiKey) {
      throw new Error("OPEN_AI_API_KEY is not set in environment");
    }

    if (!this.client) {
      this.client = new OpenAI({ apiKey: config.openAiApiKey });
    }

    return this.client;
  }

  async chat(
    messages: ChatMessage[],
    options: ChatOptions = {},
  ): Promise<string> {
    const client = this.getClient();
    const response = await client.chat.completions.create({
      model: options.model ?? config.openAiModel,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1024,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new Error("OpenAI returned an empty response");
    }

    return content;
  }

  /** Simple one-shot prompt helper for actions and pipelines. */
  async complete(prompt: string, options: ChatOptions = {}): Promise<string> {
    return this.chat([{ role: "user", content: prompt }], options);
  }

  /** Vision helper — describe or analyze an image URL for editing workflows. */
  async analyzeImage(
    imageUrl: string,
    prompt: string,
    options: ChatOptions = {},
  ): Promise<string> {
    const client = this.getClient();
    const response = await client.chat.completions.create({
      model: options.model ?? config.openAiVisionModel,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
      temperature: options.temperature ?? 0.4,
      max_tokens: options.maxTokens ?? 1024,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new Error("OpenAI returned an empty vision response");
    }

    return content;
  }
}

export const aiService = new AiService();
