import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { draftReply } from "@/lib/drafting/drafter";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const post = await prisma.discoveredPost.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Get default platform account
  const defaultAccount = await prisma.platformAccount.findFirst({
    where: { platform: post.platform, isDefault: true, isActive: true },
  });

  const result = await draftReply(post);
  if (!result) {
    return NextResponse.json(
      { error: "Failed to generate draft. Budget may be exceeded." },
      { status: 500 }
    );
  }

  const reply = await prisma.reply.create({
    data: {
      discoveredPostId: post.id,
      authorId: user.id,
      platformAccountId: defaultAccount?.id ?? null,
      draftContent: result.content,
      status: "DRAFT",
      draftModel: result.modelId,
      draftCost: result.cost,
      platform: post.platform,
    },
  });

  // Update post status
  await prisma.discoveredPost.update({
    where: { id: post.id },
    data: { status: "QUEUED" },
  });

  return NextResponse.json(reply);
}
