import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { uploadUserAvatar } from "@/lib/storage";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const avatarUrl = await uploadUserAvatar(session.user.id, file);
    await prisma.user.update({ where: { id: session.user.id }, data: { avatarUrl } });

    return NextResponse.json({ avatarUrl });
  } catch (error) {
    return errorResponse(error);
  }
}
