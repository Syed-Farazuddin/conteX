import { Injectable } from "@nestjs/common";

@Injectable()
export class ClothingService {
  getStatus() {
    return { status: "ready", features: ["render", "status"] };
  }

  render(payload: { style: string; imageUrl: string }) {
    return {
      message: "Clothing render request received.",
      payload,
      outputUrl: "https://example.com/clothing-render.png",
    };
  }
}
