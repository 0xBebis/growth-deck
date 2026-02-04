import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { fetchModels } from "@/lib/openrouter/models";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const models = await fetchModels();
    return NextResponse.json({ models });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch models" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only admins can change the default model
  const user = await prisma.user.findUnique({
    where: { email: session.user?.email ?? "" },
  });
  if (user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { defaultModelId } = body;
  if (!defaultModelId) {
    return NextResponse.json({ error: "defaultModelId required" }, { status: 400 });
  }

  await prisma.llmConfig.updateMany({
    data: { defaultModelId },
  });

  return NextResponse.json({ success: true });
}
