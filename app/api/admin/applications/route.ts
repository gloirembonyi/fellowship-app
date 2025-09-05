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
    
    // Advanced filters
    const country = url.searchParams.get("country") || "";
    const nationality = url.searchParams.get("nationality") || "";
    const educationLevel = url.searchParams.get("educationLevel") || "";
    const projectArea = url.searchParams.get("projectArea") || "";
    const professionalContext = url.searchParams.get("professionalContext") || "";
    const dateFrom = url.searchParams.get("dateFrom") || "";
    const dateTo = url.searchParams.get("dateTo") || "";
    const starred = url.searchParams.get("starred");
    const sortBy = url.searchParams.get("sortBy") || "submittedAt";
    const sortOrder = url.searchParams.get("sortOrder") || "desc";
    
    // Calculate skip value for pagination
    const skip = (page - 1) * limit;
    
    // Build filter conditions
    const where: any = {};
    
    // Add status filter if provided
    if (status) {
      where.status = status;
    }
    
    // Add country filter (exact match for dropdowns)
    if (country) {
      where.countryOfResidence = country;
    }
    
    // Add nationality filter (exact match for dropdowns)
    if (nationality) {
      where.nationality = nationality;
    }
    
    // Add education level filter (exact match for dropdowns)
    if (educationLevel) {
      where.educationLevel = educationLevel;
    }
    
    // Add project area filter (exact match for dropdowns)
    if (projectArea) {
      where.projectArea = projectArea;
    }
    
    // Add professional context filter (exact match for dropdowns)
    if (professionalContext) {
      where.professionalContext = professionalContext;
    }
    
    // Add date range filter
    if (dateFrom || dateTo) {
      where.submittedAt = {};
      if (dateFrom) {
        where.submittedAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        // Add one day to include the full end date
        const endDate = new Date(dateTo);
        endDate.setDate(endDate.getDate() + 1);
        where.submittedAt.lt = endDate;
      }
    }
    
    // Add starred filter
    if (starred === "true") {
      where.starred = true;
    } else if (starred === "false") {
      where.starred = false;
    }
    
    // Add search filter if provided (searches across multiple fields)
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { nationality: { contains: search } },
        { countryOfResidence: { contains: search } },
        { projectArea: { contains: search } },
        { workplace: { contains: search } },
        { position: { contains: search } },
      ];
    }
    
    // Get total count for pagination
    const totalCount = await prisma.application.count({ where });
    console.log(`Found ${totalCount} total applications`);
    
    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);
    
    // Build dynamic orderBy based on sortBy and sortOrder
    const orderBy: any = {};
    const validSortFields = ['submittedAt', 'firstName', 'lastName', 'status', 'nationality', 'countryOfResidence', 'projectArea', 'educationLevel'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'submittedAt';
    const order = sortOrder === 'asc' ? 'asc' : 'desc';
    orderBy[sortField] = order;

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
        educationLevel: true,
        professionalContext: true,
        workplace: true,
        position: true,
        status: true,
        submittedAt: true,
        updatedAt: true,
        starred: true,
        projectSummary: true,
      },
      orderBy,
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