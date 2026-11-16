"use client";

import { motion, useTransform, type MotionValue } from "motion/react";

/**
 * One car, three ways: the blueprint is drawn, the chassis is printed layer by layer,
 * and the finished body wipes in. `progress` runs 0 → 1.
 */

const BODY =
  "M70 218 L64 188 Q66 168 110 160 L170 150 C235 104 320 92 400 96 C450 99 490 118 525 142 C610 148 690 160 728 182 Q744 192 742 208 L736 218 L660 218 A52 52 0 0 0 556 218 L268 218 A52 52 0 0 0 164 218 Z";
const GLASS = "M198 150 C250 114 318 105 395 108 C440 111 472 126 500 146 Z";
const WHEELS = [216, 608];
const VIEW = "0 0 800 300";

// Vertical extent of the car inside the 300-unit view box, as percentages.
const CAR_TOP = 29;
const CAR_BOTTOM = 87;

const layer = "absolute inset-0 h-full w-full";

function Blueprint() {
  const draw = (delay: number, seconds = 2.2) => ({
    pathLength: 1,
    strokeDasharray: 1,
    strokeDashoffset: 1,
    style: { animation: `draw ${seconds}s cubic-bezier(0.6, 0, 0.2, 1) ${delay}s forwards` },
  });
  return (
    <svg viewBox={VIEW} className={layer} fill="none" stroke="var(--blueprint)" strokeWidth="1" aria-hidden>
      <path d={BODY} {...draw(0.2, 2.6)} />
      <path d={GLASS} {...draw(0.9)} />
      <path d="M352 107 L354 148 M354 150 L352 214 M470 150 Q476 190 470 214" opacity="0.7" {...draw(1.3)} />
      {WHEELS.map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="218" r="40" {...draw(1.0)} />
          <circle cx={cx} cy="218" r="24" opacity="0.6" {...draw(1.3)} />
          <path d={`M${cx - 6} 218 H${cx + 6} M${cx} 212 V224`} opacity="0.7" {...draw(1.6, 0.6)} />
        </g>
      ))}
      {/* Dimension lines */}
      <g opacity="0.55" strokeWidth="0.75">
        <path d="M216 276 H608 M216 268 V284 M608 268 V284" {...draw(1.8, 1.2)} />
        <path d="M64 70 H742 M64 62 V78 M742 62 V78" {...draw(2.0, 1.2)} />
        <path d="M772 96 V258 M764 96 H780 M764 258 H780" {...draw(2.2, 1.0)} />
        <path d="M30 258 H770" strokeDasharray="6 5" className="fade-up" />
      </g>
      <g
        fill="var(--blueprint)"
        stroke="none"
        fontSize="9"
        fontFamily="var(--font-geist-mono), monospace"
        letterSpacing="1.5"
        opacity="0.7"
        className="fade-up"
        style={{ animationDelay: "2.6s" }}
      >
        <text x="412" y="290" textAnchor="middle">
          2 640
        </text>
        <text x="403" y="58" textAnchor="middle">
          4 520
        </text>
        <text x="786" y="180" transform="rotate(90 786 180)" textAnchor="middle">
          1 240
        </text>
      </g>
    </svg>
  );
}

function Chassis() {
  return (
    <svg
      viewBox={VIEW}
      className={layer}
      fill="none"
      stroke="var(--chrome)"
      strokeWidth="1.4"
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden
    >
      {/* Floor rails and cross-members */}
      <path d="M108 206 H716 M120 196 H704" />
      <path d="M150 196 V206 M300 196 V206 M380 196 V206 M460 196 V206 M700 196 V206" opacity="0.6" />
      {/* Upper frame and roof hoop */}
      <path d="M108 206 L112 180 L170 152 L200 150 L262 112 L395 100 L500 146 L600 152 L716 186 L716 206" />
      {/* Triangulation */}
      <path
        d="M170 152 L150 196 M200 150 L300 196 L262 112 M300 196 L395 100 L380 196 M395 100 L460 196 L500 146 M500 146 L540 196 L600 152 L660 196 L716 186"
        opacity="0.75"
      />
      {/* Engine block */}
      <path d="M548 160 H636 V194 H548 Z M560 160 V152 H624 V160 M572 170 H612 M572 180 H612" opacity="0.85" />
      {/* Seat */}
      <path d="M322 194 L316 148 Q318 138 328 140 L338 184 H378 Q386 186 384 194 Z" opacity="0.85" />
      {/* Steering */}
      <path d="M452 150 L424 166 M418 158 L430 174" opacity="0.8" />
      {WHEELS.map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="218" r="40" />
          <circle cx={cx} cy="218" r="30" opacity="0.7" />
          <circle cx={cx} cy="218" r="16" opacity="0.5" />
          <circle cx={cx} cy="218" r="5" />
          {[0, 72, 144, 216, 288].map((a) => (
            <path key={a} d={`M${cx} 213 V188`} transform={`rotate(${a} ${cx} 218)`} opacity="0.7" />
          ))}
          {/* Suspension arms */}
          <path d={`M${cx - 36} 196 L${cx} 218 L${cx + 36} 196 M${cx} 218 L${cx + (cx < 400 ? -8 : 8)} 168`} opacity="0.6" />
        </g>
      ))}
    </svg>
  );
}

function Finished({ sweep }: { sweep?: MotionValue<number> }) {
  return (
    <svg viewBox={VIEW} className={layer} aria-hidden>
      <defs>
        <linearGradient id="car-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f7f8fa" />
          <stop offset="0.34" stopColor="#c4c9d1" />
          <stop offset="0.5" stopColor="#5d636e" />
          <stop offset="0.62" stopColor="#9aa0ab" />
          <stop offset="1" stopColor="#30343b" />
        </linearGradient>
        <linearGradient id="car-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1c2a36" />
          <stop offset="1" stopColor="#07090c" />
        </linearGradient>
        <linearGradient id="car-sweep" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="car-rim">
          <stop offset="0" stopColor="#f2f3f5" />
          <stop offset="0.7" stopColor="#8e949e" />
          <stop offset="1" stopColor="#3a3e46" />
        </radialGradient>
        <clipPath id="car-clip">
          <path d={BODY} />
        </clipPath>
      </defs>
      <ellipse cx="404" cy="258" rx="350" ry="7" fill="#000" opacity="0.55" />
      <path d={BODY} fill="url(#car-body)" />
      <g clipPath="url(#car-clip)">
        <path d="M60 172 C240 150 520 150 750 190" stroke="#fff" strokeOpacity="0.5" strokeWidth="1.2" fill="none" />
        <path d="M60 204 H750" stroke="#000" strokeOpacity="0.35" strokeWidth="10" />
        {sweep && (
          <motion.rect y="80" width="150" height="150" fill="url(#car-sweep)" transform="skewX(-22)" style={{ x: sweep }} />
        )}
      </g>
      <path d={GLASS} fill="url(#car-glass)" />
      <path d="M214 146 C262 120 318 111 388 112" stroke="#9fd8ff" strokeOpacity="0.35" fill="none" />
      <path d="M352 107 L354 148" stroke="#c4c9d1" strokeWidth="3" />
      <path d="M354 152 L352 214 M470 152 Q476 190 470 214" stroke="#000" strokeOpacity="0.4" fill="none" />
      <path d="M690 170 Q716 174 730 186 L700 184 Z" fill="var(--blueprint)" opacity="0.9" />
      <path d="M66 186 L84 180 L84 190 L68 196 Z" fill="var(--danger)" opacity="0.85" />
      {WHEELS.map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="218" r="40" fill="#0a0b0d" />
          <circle cx={cx} cy="218" r="27" fill="url(#car-rim)" />
          {[0, 72, 144, 216, 288].map((a) => (
            <path key={a} d={`M${cx - 4} 214 L${cx - 2.5} 193 H${cx + 2.5} L${cx + 4} 214 Z`} transform={`rotate(${a} ${cx} 218)`} fill="#2b2f36" />
          ))}
          <circle cx={cx} cy="218" r="5" fill="#15171b" />
        </g>
      ))}
    </svg>
  );
}

export function CarBuild({ progress }: { progress: MotionValue<number> }) {
  const print = useTransform(progress, [0.06, 0.5], [0, 1], { clamp: true });
  const finish = useTransform(progress, [0.56, 0.9], [0, 1], { clamp: true });

  const layerTop = useTransform(print, (v) => CAR_BOTTOM - v * (CAR_BOTTOM - CAR_TOP));
  const chassisClip = useTransform(layerTop, (v) => `inset(${v}% 0 0 0)`);
  const nozzleTop = useTransform(layerTop, (v) => `${v}%`);
  const nozzleOpacity = useTransform(print, [0, 0.02, 0.97, 1], [0, 1, 1, 0]);
  const blueprintOpacity = useTransform(progress, [0.06, 0.5, 0.9], [1, 0.3, 0]);
  const chassisOpacity = useTransform(finish, [0.6, 1], [1, 0]);
  const finishClip = useTransform(finish, (v) => `inset(0 ${(1 - v) * 100}% 0 0)`);
  const sweep = useTransform(progress, [0.88, 1], [-260, 900]);

  return (
    <div className="relative aspect-[8/3] w-full" role="img" aria-label="A car going from blueprint, to printed chassis, to finished chrome body">
      <motion.div className={layer} style={{ opacity: blueprintOpacity }}>
        <Blueprint />
      </motion.div>
      <motion.div className={layer} style={{ clipPath: chassisClip, opacity: chassisOpacity }}>
        <Chassis />
      </motion.div>
      <motion.div className="pointer-events-none absolute inset-x-[6%] h-px" style={{ top: nozzleTop, opacity: nozzleOpacity }}>
        <div className="h-px w-full bg-blueprint/40" />
        <div className="absolute left-1/2 -top-3" style={{ animation: "nozzle 2.4s ease-in-out infinite", width: "100%", marginLeft: "-50%" }}>
          <div className="mx-auto h-3 w-2 bg-blueprint [clip-path:polygon(0_0,100%_0,50%_100%)]" />
          <div className="mx-auto -mt-px h-1.5 w-1.5 rounded-full bg-blueprint blur-[3px]" />
        </div>
      </motion.div>
      <motion.div className={layer} style={{ clipPath: finishClip }}>
        <Finished sweep={sweep} />
      </motion.div>
    </div>
  );
}

/** The finished car, for visitors who prefer reduced motion. */
export function CarStatic() {
  return (
    <div className="relative aspect-[8/3] w-full" role="img" aria-label="A finished chrome car">
      <Finished />
    </div>
  );
}
