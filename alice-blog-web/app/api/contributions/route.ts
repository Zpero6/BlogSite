import { NextResponse } from "next/server";
import { getContributions } from "@/lib/githubContributions";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await getContributions({ noCache: true });

  return NextResponse.json(result, {
    status: result.ok ? 200 : 502,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
