import type { Course, Level } from "@/lib/types";

/** Sample catalogue: seeds the database and powers demo mode when Supabase is not connected. */
type Seed = {
  slug: string;
  title: string;
  summary: string;
  description: string;
  level: Level;
  topic: string;
  price_cents: number;
  lessons: [title: string, minutes: number][];
};

const SEEDS: Seed[] = [
  {
    slug: "fdm-fundamentals",
    title: "FDM Fundamentals",
    summary: "From a bare spool to a clean first layer. Everything you need to run a filament printer with confidence.",
    description:
      "Understand how fused deposition works, level and calibrate a machine, choose materials, and diagnose the failures every beginner meets. By the end you will print functional parts on purpose, not by luck.",
    level: "Beginner",
    topic: "FDM",
    price_cents: 4900,
    lessons: [
      ["How a filament printer builds a part", 9],
      ["Bed levelling and the first layer", 14],
      ["PLA, PETG, ABS: picking a material", 12],
      ["Temperature, speed and cooling", 16],
      ["Reading a failed print", 13],
      ["Your first functional part", 18],
    ],
  },
  {
    slug: "design-for-additive",
    title: "Design for Additive Manufacturing",
    summary: "Stop designing for the mill. Model parts that are lighter, stronger and print without supports.",
    description:
      "Overhangs, bridges, wall thickness, orientation and anisotropy: the rules that decide whether a model prints well. Worked examples take three real brackets from CAD to finished part.",
    level: "Intermediate",
    topic: "Design",
    price_cents: 8900,
    lessons: [
      ["Thinking in layers", 8],
      ["Overhangs, bridges and the 45° rule", 15],
      ["Orientation and part strength", 17],
      ["Tolerances and fits that work", 14],
      ["Lattices and lightweighting", 19],
      ["Case study: a bracket, three ways", 22],
    ],
  },
  {
    slug: "resin-printing",
    title: "Resin Printing, Safely",
    summary: "SLA and MSLA from vat to cure, with the handling habits that keep a workshop clean.",
    description:
      "Resin gives detail filament cannot, and it demands more care. Set up a safe station, support delicate models, dial in exposure and post-cure parts to full strength.",
    level: "Beginner",
    topic: "Resin",
    price_cents: 5900,
    lessons: [
      ["How light cures a layer", 7],
      ["Setting up a safe resin station", 12],
      ["Supports and orientation for detail", 16],
      ["Exposure calibration", 13],
      ["Washing and curing", 10],
    ],
  },
  {
    slug: "metal-am-intro",
    title: "Introduction to Metal AM",
    summary: "Powder bed fusion, binder jetting and DED explained for engineers evaluating metal parts.",
    description:
      "A clear map of the metal processes: what each is good at, what it costs, and where the hidden work is. Covers powder handling, build preparation, heat treatment and inspection.",
    level: "Advanced",
    topic: "Metal",
    price_cents: 14900,
    lessons: [
      ["The metal process landscape", 11],
      ["Laser powder bed fusion in depth", 21],
      ["Supports, stress and distortion", 18],
      ["Heat treatment and HIP", 15],
      ["Inspection and qualification", 17],
      ["Is this part a good candidate?", 14],
    ],
  },
  {
    slug: "slicer-mastery",
    title: "Slicer Mastery",
    summary: "The settings that matter, the ones that do not, and how to build profiles you can trust.",
    description:
      "Go past the default profile. Learn what each group of slicer settings changes in the physical part, then tune for speed, strength or surface finish.",
    level: "Intermediate",
    topic: "Software",
    price_cents: 6900,
    lessons: [
      ["What a slicer really does", 8],
      ["Walls, infill and strength", 15],
      ["Supports without the scars", 14],
      ["Speed and acceleration tuning", 16],
      ["Building a profile library", 11],
    ],
  },
  {
    slug: "post-processing",
    title: "Post-Processing and Finishing",
    summary: "Sanding, smoothing, priming and painting: take a raw print to a showroom surface.",
    description:
      "A finishing workflow for every budget. Remove supports cleanly, fill layer lines, smooth with vapour or filler primer, and paint parts that look moulded.",
    level: "Beginner",
    topic: "Finishing",
    price_cents: 0,
    lessons: [
      ["Removing supports cleanly", 9],
      ["Sanding and filling layer lines", 13],
      ["Priming for paint", 10],
      ["Painting and clear coats", 15],
    ],
  },
];

export const SAMPLE_COURSES: Course[] = SEEDS.map((s, ci) => ({
  id: `sample-${ci + 1}`,
  slug: s.slug,
  title: s.title,
  summary: s.summary,
  description: s.description,
  level: s.level,
  topic: s.topic,
  price_cents: s.price_cents,
  currency: "usd",
  published: true,
  lessons: s.lessons.map(([title, minutes], li) => ({
    id: `sample-${ci + 1}-${li + 1}`,
    course_id: `sample-${ci + 1}`,
    position: li,
    title,
    body: "",
    duration_seconds: minutes * 60,
    is_free: li === 0 || s.price_cents === 0,
    has_video: false,
  })),
}));
