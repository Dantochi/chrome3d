import type { Reel } from "@/lib/types";
import { INSTAGRAM_HANDLE } from "@/lib/env";

const captions = [
  "First layer, zero adhesion drama.",
  "Lattice bracket: 41% lighter, same load.",
  "Resin detail at 25 micron layers.",
  "Twelve hours of printing in twelve seconds.",
  "Support removal that leaves no scars.",
  "From CAD to chrome finish.",
];

/** Shown until an Instagram access token is configured. */
export const SAMPLE_REELS: Reel[] = captions.map((caption, i) => ({
  id: `sample-${i + 1}`,
  caption,
  permalink: `https://www.instagram.com/${INSTAGRAM_HANDLE}/`,
  thumbnail: null,
  video: null,
  sample: true,
}));
