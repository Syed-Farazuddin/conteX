import { pickFallbackByQuery } from "../constants/fallback-backgrounds.js";
import { config } from "../config/index.js";

export type BackgroundOrientation = "landscape" | "portrait" | "square";
export type BackgroundSource =
  | "google"
  | "pexels"
  | "unsplash"
  | "loremflickr"
  | "fallback";

export type BackgroundSearchResult = {
  url: string;
  source: BackgroundSource;
};

function toSearchQuery(scene: string, explicit?: string): string {
  if (explicit?.trim()) return explicit.trim();
  return scene.split(/\s+/).slice(0, 8).join(" ");
}

/** Portrait/abstract queries should not append "no people" — it breaks gradient & logo searches. */
function buildStockQuery(base: string): string {
  const abstract =
    /\b(gradient|abstract|minimal|texture|pattern|solid|blur|bokeh|studio|elegant|soft|logo|dark|light|pastel|neon|wallpaper)\b/i.test(
      base,
    );
  return abstract ? base : `${base} empty background no people`;
}

function dimensionsFor(orientation: BackgroundOrientation): [number, number] {
  if (orientation === "portrait") return [1350, 2400];
  if (orientation === "square") return [2400, 2400];
  return [2400, 1350];
}

export class BackgroundSearchService {
  getConfiguredProviders(): string[] {
    const providers: string[] = [];
    if (config.googleApiKey && config.googleCseId) providers.push("google");
    if (config.pexelsApiKey) providers.push("pexels");
    if (config.unsplashAccessKey) providers.push("unsplash");
    providers.push("loremflickr", "fallback");
    return providers;
  }

  isConfigured(): boolean {
    return (
      Boolean(config.googleApiKey && config.googleCseId) ||
      Boolean(config.pexelsApiKey) ||
      Boolean(config.unsplashAccessKey)
    );
  }

  async findBackgroundUrl(
    scene: string,
    orientation: BackgroundOrientation = "landscape",
    searchQuery?: string,
  ): Promise<BackgroundSearchResult> {
    const baseQuery = toSearchQuery(scene, searchQuery);
    const stockQuery = buildStockQuery(baseQuery);

    const apiSearches: Array<{
      source: BackgroundSource;
      run: () => Promise<string | null>;
    }> = [
      { source: "google", run: () => this.searchGoogle(stockQuery) },
      {
        source: "pexels",
        run: () => this.searchPexels(stockQuery, orientation),
      },
      {
        source: "unsplash",
        run: () => this.searchUnsplash(stockQuery, orientation),
      },
    ];

    for (const { source, run } of apiSearches) {
      try {
        const url = await run();
        if (url) return { url, source };
      } catch {
        /* try next provider */
      }
    }

  // No-key online search using query keywords (better than unrelated static images)
    const loremUrl = this.buildLoremFlickrUrl(baseQuery, orientation);
    if (await this.verifyImageUrl(loremUrl)) {
      return { url: loremUrl, source: "loremflickr" };
    }

    return {
      url: pickFallbackByQuery(baseQuery),
      source: "fallback",
    };
  }

  private buildLoremFlickrUrl(
    query: string,
    orientation: BackgroundOrientation,
  ): string {
    const tags = query
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 2)
      .slice(0, 4)
      .join(",");
    const [w, h] = dimensionsFor(orientation);
    const keywordPath = tags || "abstract,gradient";
    return `https://loremflickr.com/${w}/${h}/${keywordPath}`;
  }

  private async verifyImageUrl(url: string): Promise<boolean> {
    try {
      const res = await fetch(url, { method: "HEAD", redirect: "follow" });
      const type = res.headers.get("content-type") ?? "";
      return res.ok && type.startsWith("image/");
    } catch {
      return false;
    }
  }

  private async searchGoogle(query: string): Promise<string | null> {
    if (!config.googleApiKey || !config.googleCseId) return null;

    const params = new URLSearchParams({
      key: config.googleApiKey,
      cx: config.googleCseId,
      q: query,
      searchType: "image",
      num: "8",
      safe: "active",
      imgSize: "large",
      imgType: "photo",
    });

    const res = await fetch(
      `https://www.googleapis.com/customsearch/v1?${params.toString()}`,
    );
    if (!res.ok) return null;

    const data = (await res.json()) as {
      items?: { link?: string }[];
    };

    return (
      data.items?.find((item) => item.link?.startsWith("http"))?.link ?? null
    );
  }

  private async searchPexels(
    query: string,
    orientation: BackgroundOrientation,
  ): Promise<string | null> {
    if (!config.pexelsApiKey) return null;

    const params = new URLSearchParams({
      query,
      per_page: "8",
    });
    if (orientation !== "square") {
      params.set("orientation", orientation);
    }

    const res = await fetch(
      `https://api.pexels.com/v1/search?${params.toString()}`,
      { headers: { Authorization: config.pexelsApiKey } },
    );
    if (!res.ok) return null;

    const data = (await res.json()) as {
      photos?: {
        src?: { large2x?: string; original?: string; large?: string };
      }[];
    };

    const photo = data.photos?.[0]?.src;
    return photo?.large2x ?? photo?.original ?? photo?.large ?? null;
  }

  private async searchUnsplash(
    query: string,
    orientation: BackgroundOrientation,
  ): Promise<string | null> {
    if (!config.unsplashAccessKey) return null;

    const params = new URLSearchParams({
      query,
      per_page: "8",
      orientation:
        orientation === "square" ? "squarish" : orientation,
    });

    const res = await fetch(
      `https://api.unsplash.com/search/photos?${params.toString()}`,
      { headers: { Authorization: `Client-ID ${config.unsplashAccessKey}` } },
    );
    if (!res.ok) return null;

    const data = (await res.json()) as {
      results?: { urls?: { full?: string; regular?: string } }[];
    };

    const urls = data.results?.[0]?.urls;
    return urls?.full ?? urls?.regular ?? null;
  }
}

export const backgroundSearchService = new BackgroundSearchService();
