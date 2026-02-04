import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { draftReply } from "@/lib/drafting/drafter";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const reply = await prisma.reply.findUnique({
    where: { id },
    include: { discoveredPost: true },
  });

  if (!reply) return NextResponse.json({ error: "Reply not found" }, { status: 404 });

  const result = await draftReply(reply.discoveredPost);
  if (!result) {
    return NextResponse.json(
      { error: "Failed to regenerate draft" },
      { status: 500 }
    );
  }

  const updated = await prisma.reply.update({
    where: { id },
    data: {
      draftContent: result.content,
      finalContent: null,
      draftModel: result.modelId,
      draftCost: result.cost,
    },
  });

  return NextResponse.json(updated);
}
