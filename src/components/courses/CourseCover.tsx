/**
 * Generated cover art: a part sliced into print layers. The profile is derived from
 * the course slug, so every course gets its own stable shape.
 */
function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function CourseCover({ slug, className = "" }: { slug: string; className?: string }) {
  const h = hash(slug);
  const a = 0.6 + ((h & 255) / 255) * 1.6;
  const b = 1.2 + (((h >> 8) & 255) / 255) * 2.4;
  const phase = (((h >> 16) & 255) / 255) * Math.PI * 2;
  const layers = 26;
  const lines = Array.from({ length: layers }, (_, i) => {
    const t = i / (layers - 1);
    const half = 34 + 52 * Math.abs(Math.sin(t * Math.PI * a + phase)) * (0.45 + 0.55 * Math.sin(t * Math.PI)) + 14 * Math.sin(t * b * 4);
    const shift = 10 * Math.sin(t * Math.PI * b + phase);
    return { y: 150 - t * 120, x1: 160 - half + shift, x2: 160 + half + shift, t };
  });
  return (
    <div className={`bg-grid relative overflow-hidden bg-raised ${className}`}>
      <svg viewBox="0 0 320 180" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <path d="M40 158 H280" stroke="var(--line)" />
        {lines.map((l, i) => (
          <path
            key={i}
            d={`M${l.x1.toFixed(1)} ${l.y.toFixed(1)} H${l.x2.toFixed(1)}`}
            stroke={i === layers - 1 ? "var(--blueprint)" : "var(--chrome)"}
            strokeOpacity={i === layers - 1 ? 1 : 0.25 + l.t * 0.55}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        ))}
      </svg>
    </div>
  );
}
