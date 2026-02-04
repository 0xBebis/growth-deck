import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const reply = await prisma.reply.findUnique({
    where: { id },
    include: {
      discoveredPost: true,
      author: { select: { name: true, image: true } },
      platformAccount: true,
    },
  });

  if (!reply) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(reply);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const VALID_STATUSES = ["DRAFT", "SCHEDULED", "SENT", "FAILED"] as const;

  const updateData: Record<string, unknown> = {};
  if (body.finalContent !== undefined) {
    if (typeof body.finalContent !== "string") {
      return NextResponse.json({ error: "finalContent must be a string" }, { status: 400 });
    }
    updateData.finalContent = body.finalContent;
  }
  if (body.platformAccountId !== undefined) {
    if (typeof body.platformAccountId !== "string" && body.platformAccountId !== null) {
      return NextResponse.json({ error: "platformAccountId must be a string or null" }, { status: 400 });
    }
    updateData.platformAccountId = body.platformAccountId;
  }
  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }
    updateData.status = body.status;
  }
  if (body.scheduledFor !== undefined) {
    const date = new Date(body.scheduledFor);
    if (isNaN(date.getTime())) {
      return NextResponse.json({ error: "Invalid scheduledFor date" }, { status: 400 });
    }
    updateData.scheduledFor = date;
  }

  const reply = await prisma.reply.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(reply);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.reply.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
