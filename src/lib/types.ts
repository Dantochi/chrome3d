export type Level = "Beginner" | "Intermediate" | "Advanced";

export type Lesson = {
  id: string;
  course_id: string;
  position: number;
  title: string;
  body: string;
  duration_seconds: number;
  is_free: boolean;
  has_video: boolean;
};

export type Course = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  level: Level;
  topic: string;
  price_cents: number;
  currency: string;
  published: boolean;
  lessons: Lesson[];
};

export type Profile = { id: string; email: string; full_name: string | null; role: "student" | "admin" };

export type Reel = {
  id: string;
  caption: string;
  permalink: string;
  thumbnail: string | null;
  video: string | null;
  sample?: boolean;
};
