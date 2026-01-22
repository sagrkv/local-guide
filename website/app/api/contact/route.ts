import { NextRequest, NextResponse } from "next/server";

// Contact form data interface
interface ContactFormData {
  name: string;
  email: string;
  company?: string;
  budget?: string;
  description: string;
  source?: string;
}

// In-memory storage for now (will be replaced with PostgreSQL later)
// This is just to make the form functional during development
const leads: (ContactFormData & { id: string; createdAt: Date })[] = [];

export async function POST(request: NextRequest) {
  try {
    const body: ContactFormData = await request.json();

    // Validate required fields
    if (!body.name || !body.email || !body.description) {
      return NextResponse.json(
        { error: "Name, email, and description are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Create lead record
    const lead = {
      id: crypto.randomUUID(),
      name: body.name,
      email: body.email,
      company: body.company || undefined,
      budget: body.budget || undefined,
      description: body.description,
      source: body.source || undefined,
      createdAt: new Date(),
    };

    // Store in memory (for development)
    // TODO: Replace with PostgreSQL database insert
    leads.push(lead);

    console.log("New lead received:", lead);

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Thank you for your message. We'll be in touch soon!",
        id: lead.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to process your request" },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve leads (protected in production)
export async function GET() {
  // In production, this should be protected by authentication
  return NextResponse.json({
    leads,
    total: leads.length,
  });
}
