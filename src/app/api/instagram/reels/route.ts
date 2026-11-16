import { NextResponse } from "next/server";
import { getReels } from "@/lib/data/reels";

export async function GET() {
  return NextResponse.json(await getReels());
}
