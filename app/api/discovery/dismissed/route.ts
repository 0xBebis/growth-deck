import { prisma } from "@/lib/prisma";
import {
  withAuth,
  parseQuery,
  parseBody,
  dismissedQuerySchema,
  restorePostsSchema,
} from "@/lib/api";

// GET /api/discovery/dismissed - List all dismissed posts
export const GET = withAuth(async (session, request) => {
  const { search, platform } = parseQuery(request, dismissedQuerySchema);

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
      ...(platform && { platform }),
    },
    orderBy: { updatedAt: "desc" },
    include: {
      replies: {
        select: { id: true, status: true },
      },
    },
  });

  return posts;
});

// POST /api/discovery/dismissed - Restore dismissed posts
export const POST = withAuth(async (session, request) => {
  const { ids } = await parseBody(request, restorePostsSchema);

  if (ids && ids.length > 0) {
    // Restore specific posts
    const result = await prisma.discoveredPost.updateMany({
      where: {
        id: { in: ids },
        status: "DISMISSED",
      },
      data: { status: "NEW" },
    });
    return { restored: result.count };
  } else {
    // Restore all dismissed posts
    const result = await prisma.discoveredPost.updateMany({
      where: { status: "DISMISSED" },
      data: { status: "NEW" },
    });
    return { restored: result.count };
  }
});

// DELETE /api/discovery/dismissed - Permanently delete dismissed posts
export const DELETE = withAuth(async (session, request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (id) {
    // Delete single post permanently
    await prisma.discoveredPost.delete({
      where: { id, status: "DISMISSED" },
    });
    return { deleted: 1 };
  } else {
    // Delete all dismissed posts permanently
    const result = await prisma.discoveredPost.deleteMany({
      where: { status: "DISMISSED" },
    });
    return { deleted: result.count };
  }
});
