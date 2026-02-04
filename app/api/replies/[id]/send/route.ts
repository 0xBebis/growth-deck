import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const reply = await prisma.reply.findUnique({
    where: { id },
    include: { discoveredPost: true, platformAccount: true },
  });

  if (!reply) return NextResponse.json({ error: "Reply not found" }, { status: 404 });

  // Update platform account if provided
  if (body.platformAccountId) {
    await prisma.reply.update({
      where: { id },
      data: { platformAccountId: body.platformAccountId },
    });
  }

  // For Phase 1, we'll mark as sent and let the user manually post.
  // In Phase 2+, this would call the platform API to actually post.
  // The user copies the reply text, opens the original post link, and pastes.

  const updatedReply = await prisma.reply.update({
    where: { id },
    data: {
      status: "SENT",
      sentAt: new Date(),
      finalContent: reply.finalContent || reply.draftContent,
    },
  });

  // Update the discovered post status
  await prisma.discoveredPost.update({
    where: { id: reply.discoveredPostId },
    data: { status: "REPLIED" },
  });

  return NextResponse.json(updatedReply);
}
