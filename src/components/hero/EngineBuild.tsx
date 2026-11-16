"use client";

import { motion, useTransform, type MotionValue } from "motion/react";

/**
 * One turbofan engine, three ways: the blueprint is drawn, the core is printed layer by
 * layer, and the finished nacelle wipes in. `progress` runs 0 → 1.
 * Side-on section; the axis of the engine is the line y = 150.
 */

const VIEW = "0 0 800 300";
const AXIS = 150;

// Outer skin: fan cowl, then the core cowl stepping out behind it, then the exhaust cone.
const NACELLE = "M106 62 C104 46 160 36 250 36 C340 36 410 52 434 66 L434 234 C410 248 340 264 250 264 C160 264 104 254 106 238 Z";
const CORE_COWL = "M434 92 C500 97 560 108 604 121 L604 179 C560 192 500 203 434 208 Z";
const CONE = "M604 129 Q660 138 706 150 Q660 162 604 171 Z";

// Vertical extent of the engine inside the 300-unit view box, as percentages.
const TOP = 11;
const BOTTOM = 89;

const layer = "absolute inset-0 h-full w-full";

/** Blade rows along the core: [x, outer y, hub y] for the upper half. */
const ROWS = {
  booster: [262, 276, 290].map((x, i) => [x, 103 + i, 128 - i] as const),
  compressor: Array.from({ length: 9 }, (_, i) => [312 + i * 11, 104 + i * 1.3, 127 - i * 0.4] as const),
  hpTurbine: [486, 500].map((x, i) => [x, 109 - i, 128 + i] as const),
  lpTurbine: Array.from({ length: 5 }, (_, i) => [520 + i * 14, 107 - i * 1.6, 130 + i] as const),
};
const STATIONS: [string, number][] = [
  ["FAN", 195],
  ["LPC", 276],
  ["HPC", 356],
  ["COMB", 442],
  ["HPT", 493],
  ["LPT", 548],
];

/** Draws `children` for the upper half and mirrors them below the axis. */
function Mirrored({ children }: { children: React.ReactNode }) {
  return (
    <>
      <g>{children}</g>
      <g transform={`matrix(1 0 0 -1 0 ${AXIS * 2})`}>{children}</g>
    </>
  );
}

function Blueprint() {
  const draw = (delay: number, seconds = 2.2) => ({
    pathLength: 1,
    strokeDasharray: 1,
    strokeDashoffset: 1,
    style: { animation: `draw ${seconds}s cubic-bezier(0.6, 0, 0.2, 1) ${delay}s forwards` },
  });
  return (
    <svg viewBox={VIEW} className={layer} fill="none" stroke="var(--blueprint)" strokeWidth="1" aria-hidden>
      <path d={NACELLE} {...draw(0.2, 2.6)} />
      <path d={CORE_COWL} {...draw(0.8)} />
      <path d={CONE} {...draw(1.1, 1.6)} />
      <Mirrored>
        {/* Bypass duct wall, splitter and core flow path */}
        <path d="M118 66 C170 62 300 62 434 72" opacity="0.7" {...draw(1.0)} />
        <path d="M246 100 C300 92 380 92 434 98 M246 100 L246 132" opacity="0.7" {...draw(1.3)} />
        <path d="M140 150 Q152 131 184 126 L604 131" opacity="0.6" {...draw(1.5)} />
      </Mirrored>
      {/* Axis */}
      <path d="M40 150 H760" strokeDasharray="14 4 2 4" opacity="0.45" className="fade-up" />
      {/* Stations */}
      <g opacity="0.5" strokeWidth="0.75">
        {STATIONS.map(([name, x], i) => (
          <path key={name} d={`M${x} 26 V274`} strokeDasharray="3 4" className="fade-up" style={{ animationDelay: `${1.6 + i * 0.1}s` }} />
        ))}
        {/* Overall length and fan diameter */}
        <path d="M106 284 H706 M106 278 V290 M706 278 V290" {...draw(2.0, 1.2)} />
        <path d="M72 36 V264 M66 36 H78 M66 264 H78" {...draw(2.2, 1.0)} />
      </g>
      <g
        fill="var(--blueprint)"
        stroke="none"
        fontSize="8"
        fontFamily="var(--font-geist-mono), monospace"
        letterSpacing="1.5"
        opacity="0.75"
        className="fade-up"
        style={{ animationDelay: "2.6s" }}
      >
        {STATIONS.map(([name, x]) => (
          <text key={name} x={x} y="20" textAnchor="middle">
            {name}
          </text>
        ))}
        <text x="406" y="297" textAnchor="middle">
          3 730
        </text>
        <text x="60" y="150" transform="rotate(-90 60 150)" textAnchor="middle">
          Ø 1 980
        </text>
      </g>
    </svg>
  );
}

function BladeRow({ x, outer, hub, lean = 3 }: { x: number; outer: number; hub: number; lean?: number }) {
  return (
    <>
      {/* Rotor blade, its disc, and the stator vane that follows */}
      <path d={`M${x - 2.5} ${hub} L${x - 2.5 + lean} ${outer} H${x + 2.5 + lean} L${x + 2.5} ${hub} Z`} />
      <path d={`M${x} ${hub} V142 M${x - 3.5} ${hub} H${x + 3.5}`} opacity="0.55" />
      <path d={`M${x + 6} ${hub + 1} L${x + 5} ${outer + 1}`} opacity="0.4" />
    </>
  );
}

function Core() {
  return (
    <svg
      viewBox={VIEW}
      className={layer}
      fill="none"
      stroke="var(--chrome)"
      strokeWidth="1.2"
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden
    >
      <Mirrored>
        {/* Spinner and fan */}
        <path d="M140 150 Q152 131 184 126 V150" />
        <path d="M184 126 L190 66 Q200 63 210 66 L206 126 Z" />
        <path d="M188 106 H208 M189 90 H209 M190 76 H210 M197 126 L200 65" opacity="0.5" />
        {/* Fan case liner, outlet guide vane and fan frame strut */}
        <path d="M120 64 C180 60 300 60 432 70" opacity="0.6" />
        <path d="M226 64 L234 99 M232 64 L240 99" opacity="0.7" />
        <path d="M246 62 L258 100 M254 62 L266 100" />
        {/* Splitter and core casing */}
        <path d="M246 100 C300 92 380 96 414 104 L474 104 C520 100 570 102 604 121" />
        <path d="M246 100 Q240 116 250 132" opacity="0.7" />
        {/* Hub line through compressor, combustor and turbines */}
        <path d="M206 128 H300 C340 128 380 122 410 122 L474 124 C520 128 570 134 604 131" opacity="0.8" />
        {ROWS.booster.map(([x, outer, hub]) => (
          <BladeRow key={x} x={x} outer={outer} hub={hub} />
        ))}
        {ROWS.compressor.map(([x, outer, hub]) => (
          <BladeRow key={x} x={x} outer={outer} hub={hub} lean={2} />
        ))}
        {/* Annular combustor with fuel nozzle and dilution holes */}
        <path d="M418 110 C426 103 462 103 470 109 L470 119 C462 123 426 123 418 118 Z" />
        <path d="M410 113 H422 M418 110 L414 104 M430 106 v2 M442 105 v2 M454 106 v2 M430 120 v2 M442 121 v2 M454 120 v2" opacity="0.7" />
        {ROWS.hpTurbine.map(([x, outer, hub]) => (
          <BladeRow key={x} x={x} outer={outer} hub={hub} lean={-2} />
        ))}
        {ROWS.lpTurbine.map(([x, outer, hub]) => (
          <BladeRow key={x} x={x} outer={outer} hub={hub} lean={-3} />
        ))}
        {/* Turbine rear frame and exhaust cone */}
        <path d="M592 104 L598 133 M600 108 L604 131" opacity="0.8" />
        <path d="M604 131 Q660 139 706 150" />
        {/* Shafts and bearings */}
        <path d="M184 142 H600 M206 146 H520" opacity="0.8" />
        <path d="M224 136 h10 v6 h-10 Z M402 136 h10 v6 h-10 Z M584 136 h10 v6 h-10 Z" opacity="0.7" />
      </Mirrored>
      {/* Accessory gearbox under the fan case */}
      <path d="M300 252 h64 v10 q-32 8 -64 0 Z M312 252 v-6 h40 v6 M322 257 h20" opacity="0.7" />
    </svg>
  );
}

function Finished({ sweep }: { sweep?: MotionValue<number> }) {
  return (
    <svg viewBox={VIEW} className={layer} aria-hidden>
      <defs>
        <linearGradient id="eng-skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8e949e" />
          <stop offset="0.14" stopColor="#f7f8fa" />
          <stop offset="0.36" stopColor="#c4c9d1" />
          <stop offset="0.56" stopColor="#5d636e" />
          <stop offset="0.78" stopColor="#2c3037" />
          <stop offset="0.92" stopColor="#7a808b" />
          <stop offset="1" stopColor="#30343b" />
        </linearGradient>
        <linearGradient id="eng-hot" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a4f58" />
          <stop offset="0.2" stopColor="#a4a9b2" />
          <stop offset="0.55" stopColor="#3a3e46" />
          <stop offset="1" stopColor="#17191d" />
        </linearGradient>
        <linearGradient id="eng-lip" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#9aa0ab" />
        </linearGradient>
        <linearGradient id="eng-sweep" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id="eng-clip">
          <path d={NACELLE} />
        </clipPath>
      </defs>
      <ellipse cx="400" cy="284" rx="320" ry="6" fill="#000" opacity="0.5" />
      {/* Pylon */}
      <path d="M250 37 L276 14 H452 L470 37 Z" fill="#23262c" />
      <path d="M276 14 H452" stroke="#5d636e" />
      {/* Exhaust cone and core cowl */}
      <path d={CONE} fill="url(#eng-hot)" />
      <path d={CORE_COWL} fill="url(#eng-hot)" />
      <path d="M604 121 V179" stroke="#0a0b0d" strokeWidth="3" />
      <path d="M470 96 V204 M540 105 V195" stroke="#000" strokeOpacity="0.35" />
      {/* Fan nozzle shadow where the core emerges */}
      <path d="M426 64 H436 V236 H426 Z" fill="#08090b" />
      {/* Fan cowl */}
      <path d={NACELLE} fill="url(#eng-skin)" />
      <g clipPath="url(#eng-clip)">
        <path d="M100 96 C200 84 340 84 440 100" stroke="#fff" strokeOpacity="0.45" strokeWidth="1.2" fill="none" />
        {/* Panel lines, latches and access door */}
        <path d="M168 30 V270 M300 30 V270 M392 40 V260" stroke="#000" strokeOpacity="0.3" fill="none" />
        <path d="M300 150 H392" stroke="#000" strokeOpacity="0.25" />
        <path d="M322 206 h44 v26 h-44 Z" stroke="#000" strokeOpacity="0.3" fill="none" />
        <path d="M296 120 h8 M296 180 h8 M296 228 h8" stroke="#0a0b0d" strokeWidth="2.5" />
        {/* Livery band */}
        <path d="M100 168 C200 160 340 160 440 172 L440 178 C340 166 200 166 100 174 Z" fill="var(--blueprint)" opacity="0.85" />
        {sweep && <motion.rect y="20" width="150" height="260" fill="url(#eng-sweep)" transform="skewX(-22)" style={{ x: sweep }} />}
      </g>
      {/* Polished intake lip with the fan visible inside */}
      <ellipse cx="108" cy="150" rx="11" ry="89" fill="#0a0b0d" />
      {Array.from({ length: 9 }, (_, i) => (
        <path key={i} d={`M103 ${78 + i * 18} Q110 ${84 + i * 18} 116 ${80 + i * 18}`} stroke="#5d636e" strokeWidth="1" fill="none" />
      ))}
      <ellipse cx="108" cy="150" rx="4" ry="16" fill="#7a808b" />
      <ellipse cx="108" cy="150" rx="11" ry="89" fill="none" stroke="url(#eng-lip)" strokeWidth="5" />
    </svg>
  );
}

export function EngineBuild({ progress }: { progress: MotionValue<number> }) {
  const print = useTransform(progress, [0.06, 0.5], [0, 1], { clamp: true });
  const finish = useTransform(progress, [0.56, 0.9], [0, 1], { clamp: true });

  const layerTop = useTransform(print, (v) => BOTTOM - v * (BOTTOM - TOP));
  const coreClip = useTransform(layerTop, (v) => `inset(${v}% 0 0 0)`);
  const nozzleTop = useTransform(layerTop, (v) => `${v}%`);
  const nozzleOpacity = useTransform(print, [0, 0.02, 0.97, 1], [0, 1, 1, 0]);
  const blueprintOpacity = useTransform(progress, [0.06, 0.5, 0.9], [1, 0.3, 0]);
  const coreOpacity = useTransform(finish, [0.6, 1], [1, 0]);
  const finishClip = useTransform(finish, (v) => `inset(0 ${(1 - v) * 100}% 0 0)`);
  const sweep = useTransform(progress, [0.88, 1], [-260, 760]);

  return (
    <div
      className="relative aspect-[8/3] w-full"
      role="img"
      aria-label="A jet engine going from blueprint, to its printed core, to the finished chrome engine"
    >
      <motion.div className={layer} style={{ opacity: blueprintOpacity }}>
        <Blueprint />
      </motion.div>
      <motion.div className={layer} style={{ clipPath: coreClip, opacity: coreOpacity }}>
        <Core />
      </motion.div>
      <motion.div className="pointer-events-none absolute inset-x-[10%] h-px" style={{ top: nozzleTop, opacity: nozzleOpacity }}>
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

/** The finished engine, for visitors who prefer reduced motion. */
export function EngineStatic() {
  return (
    <div className="relative aspect-[8/3] w-full" role="img" aria-label="A finished chrome jet engine">
      <Finished />
    </div>
  );
}
