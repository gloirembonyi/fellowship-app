import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    console.log("Fetching applications from database...");
    
    // Get query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const status = url.searchParams.get("status") || "";
    const search = url.searchParams.get("search") || "";
    
    // Calculate skip value for pagination
    const skip = (page - 1) * limit;
    
    // Build filter conditions
    const where: any = {};
    
    // Add status filter if provided
    if (status) {
      where.status = status;
    }
    
    // Add search filter if provided
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }
    
    // Get total count for pagination
    const totalCount = await prisma.application.count({ where });
    console.log(`Found ${totalCount} total applications`);
    
    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);
    
    // Get applications with pagination, sorting, and filtering
    const applications = await prisma.application.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        nationality: true,
        countryOfResidence: true,
        projectArea: true,
        status: true,
        submittedAt: true,
        updatedAt: true,
        professionalContext: true,
        projectSummary: true,
      },
      orderBy: {
        submittedAt: "desc",
      },
      skip,
      take: limit,
    });
    
    console.log(`Returning ${applications.length} applications for page ${page}`);
    
    // Return applications with pagination metadata
    return NextResponse.json({
      applications,
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error("Error fetching applications:", error);
    
    // Provide more detailed error information
    let errorMessage = "Failed to fetch applications";
    if (error instanceof Error) {
      errorMessage = `${errorMessage}: ${error.message}`;
      console.error(error.stack);
    }
    
    return NextResponse.json(
      { error: errorMessage, applications: [] },
      { status: 500 }
    );
  }
} 