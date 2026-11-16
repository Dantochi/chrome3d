/** Shared class recipes so every page writes buttons, fields and panels the same way. */
const btn =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50";

export const btnPrimary = `${btn} bg-chrome text-ink hover:bg-white`;
export const btnGhost = `${btn} border border-line text-chrome hover:border-steel`;
export const btnDanger = `${btn} border border-line text-danger hover:border-danger`;
export const btnSmall =
  "inline-flex h-9 items-center justify-center gap-2 rounded-full border border-line px-4 text-xs font-medium text-chrome transition-colors hover:border-steel disabled:opacity-50";

export const field =
  "h-11 w-full rounded-lg border border-line bg-panel px-3 text-sm text-chrome placeholder:text-steel/60 transition-colors focus:border-blueprint focus:outline-none";
export const textarea = field.replace("h-11", "min-h-28 py-2.5");
export const fieldLabel = "label mb-2 block";

export const panel = "rounded-2xl border border-line bg-panel";
export const container = "mx-auto w-full max-w-7xl px-5 sm:px-8";
