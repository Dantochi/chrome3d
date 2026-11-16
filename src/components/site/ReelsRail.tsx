import { getReels } from "@/lib/data/reels";
import { INSTAGRAM_HANDLE } from "@/lib/env";
import { btnGhost, container } from "@/components/ui/styles";

const TINTS = ["#1b2530", "#22201c", "#1c2422", "#241c22", "#1c1f29", "#232320"];

export async function ReelsRail() {
  const { reels, live } = await getReels();
  return (
    <section id="reels" className="scroll-mt-16 border-b border-line py-20 sm:py-28">
      <div className={`${container} flex flex-col justify-between gap-6 sm:flex-row sm:items-end`}>
        <div>
          <p className="label">From the workshop · @{INSTAGRAM_HANDLE}</p>
          <h2 className="mt-4 font-display text-3xl font-medium tracking-tight sm:text-5xl">Latest reels</h2>
        </div>
        <a href={`https://www.instagram.com/${INSTAGRAM_HANDLE}/`} target="_blank" rel="noreferrer" className={btnGhost}>
          Follow on Instagram
        </a>
      </div>
      <ul
        className="rail mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:none]"
        data-lenis-prevent
      >
        {reels.map((reel, i) => (
          <li key={reel.id} className="w-56 shrink-0 snap-start sm:w-64">
            <a
              href={reel.permalink}
              target="_blank"
              rel="noreferrer"
              className="group relative block aspect-[9/16] overflow-hidden rounded-2xl border border-line bg-panel transition-colors hover:border-steel"
            >
              {reel.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={reel.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              ) : (
                <div className="bg-grid h-full w-full" style={{ backgroundColor: TINTS[i % TINTS.length] }} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/10 to-transparent" />
              <span className="absolute left-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-chrome/40 bg-ink/40 backdrop-blur">
                <svg viewBox="0 0 12 12" className="h-3 w-3 translate-x-px fill-chrome" aria-hidden>
                  <path d="M2 1v10l9-5z" />
                </svg>
              </span>
              {reel.sample && <span className="label absolute right-4 top-6">Sample</span>}
              <p className="absolute inset-x-4 bottom-4 text-sm leading-snug">{reel.caption || "Watch on Instagram"}</p>
            </a>
          </li>
        ))}
      </ul>
      {!live && (
        <p className={`${container} label mt-4`}>Sample cards shown until the Instagram account is connected.</p>
      )}
    </section>
  );
}
