import { SAMPLE_REELS } from "@/content/reels.sample";
import type { Reel } from "@/lib/types";

type IgMedia = {
  id: string;
  caption?: string;
  media_type: string;
  media_product_type?: string;
  media_url?: string;
  permalink: string;
  thumbnail_url?: string;
};

/**
 * Latest reels from the company's Instagram account via the Instagram Graph API.
 * Falls back to sample cards when no access token is set or the request fails.
 */
export async function getReels(limit = 8): Promise<{ reels: Reel[]; live: boolean }> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) return { reels: SAMPLE_REELS, live: false };
  try {
    const url = new URL("https://graph.instagram.com/me/media");
    url.searchParams.set("fields", "id,caption,media_type,media_product_type,media_url,permalink,thumbnail_url");
    url.searchParams.set("limit", "40");
    url.searchParams.set("access_token", token);
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`Instagram responded ${res.status}`);
    const json = (await res.json()) as { data: IgMedia[] };
    const reels = json.data
      .filter((m) => m.media_product_type === "REELS" || m.media_type === "VIDEO")
      .slice(0, limit)
      .map<Reel>((m) => ({
        id: m.id,
        caption: (m.caption ?? "").split("\n")[0].slice(0, 120),
        permalink: m.permalink,
        thumbnail: m.thumbnail_url ?? null,
        video: m.media_url ?? null,
      }));
    if (reels.length === 0) return { reels: SAMPLE_REELS, live: false };
    return { reels, live: true };
  } catch (error) {
    console.error("Instagram reels unavailable:", error);
    return { reels: SAMPLE_REELS, live: false };
  }
}
