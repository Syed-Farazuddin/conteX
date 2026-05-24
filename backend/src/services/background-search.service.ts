import { randomInt } from "node:crypto";
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

    const loremCandidates = this.buildLoremFlickrCandidates(
      baseQuery,
      orientation,
    );
    for (const loremUrl of loremCandidates) {
      const resolved = await this.resolveLoremFlickrUrl(loremUrl);
      if (resolved) {
        return { url: resolved, source: "loremflickr" };
      }
    }

    return {
      url: pickFallbackByQuery(baseQuery, { variety: true }),
      source: "fallback",
    };
  }

  /** Try full query, then broader tags — loremflickr often 404s to the same defaultImage. */
  private buildLoremFlickrCandidates(
    query: string,
    orientation: BackgroundOrientation,
  ): string[] {
    const words = query
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 2);
    const [w, h] = dimensionsFor(orientation);
    const paths: string[] = [];

    if (words.length >= 2) {
      paths.push(words.slice(0, 4).join(","));
      paths.push(words.slice(0, 2).join(","));
    }
    if (words.length === 1) {
      paths.push(words[0]);
    }
    paths.push("nature,landscape", "abstract,gradient");

    const seen = new Set<string>();
    return paths
      .map((keywordPath) => `https://loremflickr.com/${w}/${h}/${keywordPath}`)
      .filter((url) => {
        if (seen.has(url)) return false;
        seen.add(url);
        return true;
      });
  }

  /** Follow redirects once so each request can land on a different Flickr photo. */
  private async resolveLoremFlickrUrl(
    loremUrl: string,
  ): Promise<string | null> {
    try {
      const res = await fetch(loremUrl, { redirect: "follow" });
      if (!res.ok) return null;
      if (this.isLoremFlickrPlaceholder(res.url)) return null;

      const type = res.headers.get("content-type") ?? "";
      if (!type.startsWith("image/")) return null;

      return res.url;
    } catch {
      return null;
    }
  }

  /** loremflickr serves this when no photo matches — always the same ugly tile. */
  private isLoremFlickrPlaceholder(resolvedUrl: string): boolean {
    return /defaultImage/i.test(resolvedUrl);
  }

  private pickRandom<T>(items: T[]): T | null {
    if (items.length === 0) return null;
    return items[randomInt(items.length)];
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

    const links =
      data.items
        ?.map((item) => item.link)
        .filter((link): link is string => Boolean(link?.startsWith("http"))) ??
      [];
    return this.pickRandom(links);
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

    const photos = data.photos ?? [];
    const photo = this.pickRandom(photos)?.src;
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
      orientation: orientation === "square" ? "squarish" : orientation,
    });

    const res = await fetch(
      `https://api.unsplash.com/search/photos?${params.toString()}`,
      { headers: { Authorization: `Client-ID ${config.unsplashAccessKey}` } },
    );
    if (!res.ok) return null;

    const data = (await res.json()) as {
      results?: { urls?: { full?: string; regular?: string } }[];
    };

    const results = data.results ?? [];
    const urls = this.pickRandom(results)?.urls;
    return urls?.full ?? urls?.regular ?? null;
  }
}

export const backgroundSearchService = new BackgroundSearchService();
