"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { btnGhost, btnPrimary, container } from "@/components/ui/styles";
import { EngineBuild, EngineStatic } from "./EngineBuild";

const STAGES = ["Blueprint", "Core", "Finished"];
const LAYERS = 310;

function Copy() {
  return (
    <div className={`${container} relative z-10 pt-24 sm:pt-28`}>
      <p className="label fade-up">Additive manufacturing academy</p>
      <h1
        className="fade-up mt-5 max-w-5xl font-display text-[clamp(2.5rem,min(8.2vw,12.5svh),7.25rem)] font-medium leading-[0.92] tracking-tighter"
        style={{ animationDelay: "0.08s" }}
      >
        <span className="text-chrome">Learn to build</span>
        <br />
        <span className="text-chrome">layer by layer.</span>
      </h1>
      <div className="fade-up mt-7 flex max-w-xl flex-col gap-6" style={{ animationDelay: "0.18s" }}>
        <p className="text-base leading-relaxed text-steel sm:text-lg">
          Chrome3d teaches the craft of 3D printing, from your first layer to production metal parts. Video courses
          made by people who print for a living.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/courses" className={btnPrimary}>
            Browse courses
          </Link>
          <Link href="/#reels" className={btnGhost}>
            Watch our reels
          </Link>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [stage, setStage] = useState(0);
  const [layerNo, setLayerNo] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    setStage(p < 0.06 ? 0 : p < 0.56 ? 1 : 2);
    setLayerNo(Math.round(Math.min(1, Math.max(0, (p - 0.06) / 0.44)) * LAYERS));
  });

  if (reduced) {
    return (
      <section className="bg-grid relative overflow-hidden border-b border-line pb-10">
        <Copy />
        <div className="mx-auto mt-10 w-[min(1100px,96vw)]">
          <EngineStatic />
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} className="relative h-[240svh] border-b border-line">
      <div className="bg-grid sticky top-0 flex h-svh flex-col overflow-hidden">
        <div className="hero-glow pointer-events-none absolute inset-0" />
        <Copy />
        {/* The engine takes whatever height is left and never spills past it. */}
        <div className="relative mx-auto mt-4 flex min-h-0 w-[min(1100px,96vw)] flex-1 items-end justify-center [container-type:size]">
          <div className="opacity-90" style={{ width: "min(100cqw, calc(100cqh * 8 / 3))" }}>
            <EngineBuild progress={scrollYProgress} />
          </div>
        </div>
        <div className={`${container} relative z-10 flex items-center justify-between gap-6 pb-6 pt-2`}>
          <ol className="flex gap-5 sm:gap-8">
            {STAGES.map((name, i) => (
              <li
                key={name}
                className={`label flex items-center gap-2 transition-colors duration-500 ${i === stage ? "!text-chrome" : ""}`}
              >
                <span className={`h-1 w-1 rounded-full transition-colors duration-500 ${i === stage ? "bg-blueprint" : "bg-line"}`} />
                <span className="hidden sm:inline">0{i + 1}</span> {name}
              </li>
            ))}
          </ol>
          <p className="label hidden tabular-nums sm:block" aria-hidden>
            Layer {String(layerNo).padStart(4, "0")} / {String(LAYERS).padStart(4, "0")}
          </p>
        </div>
      </div>
    </section>
  );
}
