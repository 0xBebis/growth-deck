import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    let config = await prisma.autopilotConfig.findFirst();

    if (!config) {
      config = await prisma.autopilotConfig.create({
        data: {},
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error("Failed to get autopilot config:", error);
    return NextResponse.json({ error: "Failed to get config" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    let config = await prisma.autopilotConfig.findFirst();

    if (!config) {
      config = await prisma.autopilotConfig.create({
        data: body,
      });
    } else {
      config = await prisma.autopilotConfig.update({
        where: { id: config.id },
        data: body,
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error("Failed to update autopilot config:", error);
    return NextResponse.json({ error: "Failed to update config" }, { status: 500 });
  }
}
