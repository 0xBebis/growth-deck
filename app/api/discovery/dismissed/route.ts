import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/discovery/dismissed - List all dismissed posts
export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const platform = searchParams.get("platform");

  const posts = await prisma.discoveredPost.findMany({
    where: {
      status: "DISMISSED",
      ...(search && {
        OR: [
          { content: { contains: search, mode: "insensitive" } },
          { authorHandle: { contains: search, mode: "insensitive" } },
          { authorName: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(platform && { platform: platform as "X" | "LINKEDIN" | "REDDIT" | "HN" }),
    },
    orderBy: { updatedAt: "desc" },
    include: {
      replies: {
        select: { id: true, status: true },
      },
    },
  });

  return NextResponse.json(posts);
}

// POST /api/discovery/dismissed - Restore all dismissed posts
export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  // Restore specific posts or all
  if (body.ids && Array.isArray(body.ids)) {
    // Restore specific posts
    const result = await prisma.discoveredPost.updateMany({
      where: {
        id: { in: body.ids },
        status: "DISMISSED",
      },
      data: { status: "NEW" },
    });
    return NextResponse.json({ restored: result.count });
  } else {
    // Restore all dismissed posts
    const result = await prisma.discoveredPost.updateMany({
      where: { status: "DISMISSED" },
      data: { status: "NEW" },
    });
    return NextResponse.json({ restored: result.count });
  }
}

// DELETE /api/discovery/dismissed - Permanently delete dismissed posts
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (id) {
    // Delete single post permanently
    await prisma.discoveredPost.delete({
      where: { id, status: "DISMISSED" },
    });
    return NextResponse.json({ deleted: 1 });
  } else {
    // Delete all dismissed posts permanently
    const result = await prisma.discoveredPost.deleteMany({
      where: { status: "DISMISSED" },
    });
    return NextResponse.json({ deleted: result.count });
  }
}
