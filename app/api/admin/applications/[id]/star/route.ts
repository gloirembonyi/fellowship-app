import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/admin/applications/[id]/star - Toggle star status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { starred } = body;

    if (typeof starred !== "boolean") {
      return NextResponse.json(
        { error: "Starred must be a boolean value" },
        { status: 400 }
      );
    }

    // Update the application's starred status
    const updatedApplication = await prisma.application.update({
      where: { id },
      data: { starred },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        starred: true,
      },
    });

    return NextResponse.json({
      success: true,
      application: updatedApplication,
      message: starred ? "Application starred successfully" : "Application unstarred successfully"
    });
  } catch (error) {
    console.error("Error updating star status:", error);
    return NextResponse.json(
      { error: "Failed to update star status" },
      { status: 500 }
    );
  }
}

