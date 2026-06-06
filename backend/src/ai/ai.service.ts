import { Injectable } from "@nestjs/common";

@Injectable()
export class AiService {
  getStatus() {
    return { status: "ready", provider: "Nest AI placeholder" };
  }

  chat(payload: { messages: Array<Record<string, unknown>> }) {
    return {
      reply: "This is a placeholder chat response. Replace with OpenAI or other AI integration.",
      received: payload.messages,
    };
  }

  planPipeline(payload: { prompt: string }) {
    return {
      plan: [
        { step: 1, description: "Interpret prompt." },
        { step: 2, description: "Select model and style." },
        { step: 3, description: "Run generation pipeline." },
      ],
      prompt: payload.prompt,
    };
  }
}
