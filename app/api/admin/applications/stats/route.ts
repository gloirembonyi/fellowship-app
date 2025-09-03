import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    console.log("Fetching application statistics...");
    
    // Get total count
    const total = await prisma.application.count();
    
    // Get counts by status
    const pending = await prisma.application.count({
      where: { status: "pending" }
    });
    
    const approved = await prisma.application.count({
      where: { status: "approved" }
    });
    
    const rejected = await prisma.application.count({
      where: { status: "rejected" }
    });
    
    console.log(`Stats: Total: ${total}, Pending: ${pending}, Approved: ${approved}, Rejected: ${rejected}`);
    
    return NextResponse.json({
      total,
      pending,
      approved,
      rejected
    });
  } catch (error) {
    console.error("Error fetching application statistics:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to fetch statistics",
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0
      },
      { status: 500 }
    );
  }
}


