import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Sample data for seeding
const sampleApplications = [
  {
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    nationality: "Rwanda",
    countryOfResidence: "Rwanda",
    phone: "+250700000001",
    address: "Kigali, Rwanda",
    workplace: "ABC Corporation",
    position: "Software Engineer",
    educationLevel: "Master's Degree",
    professionalContext: "Technology",
    expectedContribution: "Technical expertise",
    projectType: "Individual",
    projectArea: "Software Development",
    projectSummary: "Building a mobile app for community health workers",
    projectMotivation: "Improve healthcare access in rural areas",
    gender: "Male",
    title: "Mr",
    status: "pending"
  },
  {
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.smith@example.com",
    nationality: "Kenya",
    countryOfResidence: "Rwanda",
    phone: "+250700000002",
    address: "Kigali, Rwanda",
    workplace: "XYZ Organization",
    position: "Project Manager",
    educationLevel: "Bachelor's Degree",
    professionalContext: "Non-profit",
    expectedContribution: "Project management",
    projectType: "Team",
    projectArea: "Agriculture",
    projectSummary: "Developing sustainable farming techniques for small-scale farmers",
    projectMotivation: "Enhance food security in East Africa",
    gender: "Female",
    title: "Ms",
    status: "approved"
  },
  {
    firstName: "Michael",
    lastName: "Johnson",
    email: "michael.johnson@example.com",
    nationality: "Uganda",
    countryOfResidence: "Uganda",
    phone: "+256700000003",
    address: "Kampala, Uganda",
    workplace: "University of Kampala",
    position: "Researcher",
    educationLevel: "PhD",
    professionalContext: "Academia",
    expectedContribution: "Research methodology",
    projectType: "Individual",
    projectArea: "Education",
    projectSummary: "Research on improving educational outcomes in rural schools",
    projectMotivation: "Reduce educational inequality",
    gender: "Male",
    title: "Dr",
    status: "rejected"
  },
  {
    firstName: "Sarah",
    lastName: "Williams",
    email: "sarah.williams@example.com",
    nationality: "Tanzania",
    countryOfResidence: "Tanzania",
    phone: "+255700000004",
    address: "Dar es Salaam, Tanzania",
    workplace: "Health Ministry",
    position: "Health Policy Advisor",
    educationLevel: "Master's Degree",
    professionalContext: "Government",
    expectedContribution: "Policy expertise",
    projectType: "Team",
    projectArea: "Healthcare",
    projectSummary: "Developing a framework for community health insurance",
    projectMotivation: "Improve healthcare financing",
    gender: "Female",
    title: "Mrs",
    status: "pending"
  },
  {
    firstName: "David",
    lastName: "Mutesa",
    email: "david.mutesa@example.com",
    nationality: "Rwanda",
    countryOfResidence: "Rwanda",
    phone: "+250700000005",
    address: "Kigali, Rwanda",
    workplace: "Tech Startup",
    position: "Entrepreneur",
    educationLevel: "Bachelor's Degree",
    professionalContext: "Business",
    expectedContribution: "Entrepreneurship",
    projectType: "Individual",
    projectArea: "Technology",
    projectSummary: "Creating a platform for connecting local artisans to global markets",
    projectMotivation: "Support local businesses and preserve cultural heritage",
    gender: "Male",
    title: "Mr",
    status: "approved"
  }
];

export async function POST(request: NextRequest) {
  try {
    console.log("Starting to seed sample application data...");
    
    // Check if we already have applications
    const existingCount = await prisma.application.count();
    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing applications, skipping seed`);
      return NextResponse.json({ 
        success: false, 
        message: "Database already contains applications. Seeding skipped." 
      });
    }
    
    // Create sample applications
    const createdApplications = [];
    for (const app of sampleApplications) {
      const createdApp = await prisma.application.create({
        data: {
          ...app,
          submittedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000), // Random date within last 30 days
          updatedAt: new Date(),
          createdAt: new Date(),
        }
      });
      createdApplications.push(createdApp);
      console.log(`Created application for ${app.firstName} ${app.lastName}`);
    }
    
    console.log(`Successfully created ${createdApplications.length} sample applications`);
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully created ${createdApplications.length} sample applications` 
    });
  } catch (error) {
    console.error("Error seeding sample data:", error);
    
    let errorMessage = "Failed to seed sample data";
    if (error instanceof Error) {
      errorMessage = `${errorMessage}: ${error.message}`;
      console.error(error.stack);
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
} 