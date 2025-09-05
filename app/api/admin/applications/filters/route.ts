import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    console.log("Fetching filter options...");

    // Get unique values for filter dropdowns
    const [
      countries,
      nationalities,
      educationLevels,
      projectAreas,
      professionalContexts,
    ] = await Promise.all([
      // Unique countries of residence
      prisma.application.findMany({
        select: { countryOfResidence: true },
        distinct: ['countryOfResidence'],
        orderBy: { countryOfResidence: 'asc' },
      }),
      
      // Unique nationalities
      prisma.application.findMany({
        select: { nationality: true },
        distinct: ['nationality'],
        orderBy: { nationality: 'asc' },
      }),
      
      // Unique education levels
      prisma.application.findMany({
        select: { educationLevel: true },
        distinct: ['educationLevel'],
        orderBy: { educationLevel: 'asc' },
      }),
      
      // Unique project areas
      prisma.application.findMany({
        select: { projectArea: true },
        distinct: ['projectArea'],
        orderBy: { projectArea: 'asc' },
      }),
      
      // Unique professional contexts
      prisma.application.findMany({
        select: { professionalContext: true },
        distinct: ['professionalContext'],
        orderBy: { professionalContext: 'asc' },
      }),
    ]);

    // Transform to simple arrays
    const filterOptions = {
      countries: countries.map(item => item.countryOfResidence).filter(Boolean),
      nationalities: nationalities.map(item => item.nationality).filter(Boolean),
      educationLevels: educationLevels.map(item => item.educationLevel).filter(Boolean),
      projectAreas: projectAreas.map(item => item.projectArea).filter(Boolean),
      professionalContexts: professionalContexts.map(item => item.professionalContext).filter(Boolean),
    };

    console.log("Filter options retrieved successfully");
    
    return NextResponse.json({
      success: true,
      filters: filterOptions,
    });
  } catch (error) {
    console.error("Error fetching filter options:", error);
    return NextResponse.json(
      { error: "Failed to fetch filter options" },
      { status: 500 }
    );
  }
}

