import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { KEYWORD_CATEGORIES, type KeywordCategory } from "@/lib/constants/keywords";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const keywords = await prisma.keyword.findMany({
    where: { isActive: true },
    orderBy: [{ category: "asc" }, { postsMatched: "desc" }],
    select: {
      id: true,
      phrase: true,
      category: true,
      postsMatched: true,
    },
  });

  // Group by category
  const grouped = keywords.reduce(
    (acc, kw) => {
      const cat = kw.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(kw);
      return acc;
    },
    {} as Record<string, typeof keywords>
  );

  return NextResponse.json({
    keywords,
    grouped,
    total: keywords.length,
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { phrase, category } = body;

  if (!phrase || typeof phrase !== "string" || phrase.trim().length === 0) {
    return NextResponse.json({ error: "Phrase is required" }, { status: 400 });
  }

  if (!category || !KEYWORD_CATEGORIES.includes(category as KeywordCategory)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  // Check for duplicate
  const existing = await prisma.keyword.findFirst({
    where: { phrase: { equals: phrase.trim(), mode: "insensitive" } },
  });

  if (existing) {
    return NextResponse.json({ error: "Keyword already exists" }, { status: 409 });
  }

  const keyword = await prisma.keyword.create({
    data: {
      phrase: phrase.trim(),
      category: category as KeywordCategory,
    },
  });

  return NextResponse.json(keyword, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  await prisma.keyword.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
