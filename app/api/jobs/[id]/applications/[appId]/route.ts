import { NextResponse } from "next/server";

/** @deprecated Use PATCH /api/applications/[id] instead. */
export async function PATCH() {
  return NextResponse.json(
    { error: "Use PATCH /api/applications/[id]" },
    { status: 410 }
  );
}
