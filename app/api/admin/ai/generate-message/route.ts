import { NextRequest, NextResponse } from "next/server";
import * as jose from 'jose';

// Secret for JWT verification
const JWT_SECRET = process.env.JWT_SECRET || 'fellowship-program-jwt-secret';
const SECRET = new TextEncoder().encode(JWT_SECRET);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyBtUBbljTWSwtqc--T1uXni3rbZ8yAuCB4";

// Verify admin token from cookies
async function verifyAdminToken(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    
    if (!token) {
      return null;
    }
    
    const decodedToken = await jose.jwtVerify(token, SECRET);
    const payload = decodedToken.payload as any;
    
    if (!payload || payload.role !== 'admin') {
      return null;
    }

    return payload;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminUser = await verifyAdminToken(request);
    
    if (!adminUser || !['admin', 'super_admin'].includes(adminUser.role)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const { prompt, messageType, applicantName } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { success: false, message: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Prepare the AI prompt based on message type
    let systemPrompt = '';
    if (messageType === 'funding_request') {
      systemPrompt = `You are a professional administrative assistant for the Ministry of Health Affiliate Fellowship Program in Rwanda. Your task is to generate a highly professional, personalized email message for requesting additional funding information from fellowship applicants.

CONTEXT:
- Recipient: ${applicantName || 'a fellowship applicant'}
- Program: MoH Affiliate Fellowship Program
- Purpose: Request additional funding and sustainability information
- Tone: Professional, encouraging, and supportive
- Language: Clear, concise, and respectful

REQUIREMENTS:
- Write in a warm yet professional tone that reflects the program's values
- Be specific about what funding information is needed
- Include encouraging language that motivates the applicant
- Keep the message concise but comprehensive (2-3 well-structured paragraphs)
- Use proper email formatting and structure
- Address the applicant by name when possible
- Include a clear call-to-action
- Maintain the official program voice while being approachable
- IMPORTANT: Use plain text formatting only - NO markdown, NO asterisks, NO bold formatting
- Use simple bullet points with dashes (-) instead of asterisks (*)
- Write in clean, readable plain text that can be displayed in any email client

FUNDING INFORMATION TO REQUEST:
- Estimated project budget
- Funding sources (grants, institutional support, personal contributions, partnerships)
- Funding status (secured or not yet secured)
- Proof of funding (if secured) or funding plan (if not secured)
- Sustainability plan beyond the fellowship period

ADMIN REQUEST: ${prompt}

Generate a complete, professional email message that can be sent directly to the applicant. The message should be engaging, clear, and motivate the applicant to provide the requested information promptly.

CRITICAL FORMATTING RULES:
- Use ONLY plain text - no markdown formatting
- Use dashes (-) for bullet points, NOT asterisks (*)
- Do NOT use ** for bold text
- Do NOT use * for italic text
- Write in clean, readable plain text format
- Ensure the message looks professional in any email client`;
    } else {
      systemPrompt = `You are a professional administrative assistant for the Ministry of Health Affiliate Fellowship Program in Rwanda. Generate a highly professional, personalized email message.

CONTEXT:
- Recipient: ${applicantName || 'a fellowship applicant'}
- Program: MoH Affiliate Fellowship Program
- Purpose: ${prompt}
- Tone: Professional, encouraging, and supportive
- Language: Clear, concise, and respectful

REQUIREMENTS:
- Write in a warm yet professional tone
- Be specific and clear about the purpose
- Include encouraging language
- Keep the message concise but comprehensive
- Use proper email formatting
- Address the applicant by name when possible
- Maintain the official program voice while being approachable
- IMPORTANT: Use plain text formatting only - NO markdown, NO asterisks, NO bold formatting
- Use simple bullet points with dashes (-) instead of asterisks (*)
- Write in clean, readable plain text that can be displayed in any email client

ADMIN REQUEST: ${prompt}

Generate a complete, professional email message that can be sent directly to the applicant.

CRITICAL FORMATTING RULES:
- Use ONLY plain text - no markdown formatting
- Use dashes (-) for bullet points, NOT asterisks (*)
- Do NOT use ** for bold text
- Do NOT use * for italic text
- Write in clean, readable plain text format
- Ensure the message looks professional in any email client`;
    }

    // Debug: Check if API key is available
    console.log('GEMINI_API_KEY available:', !!GEMINI_API_KEY);
    console.log('GEMINI_API_KEY length:', GEMINI_API_KEY?.length || 0);
    
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { success: false, message: 'AI service not configured' },
        { status: 500 }
      );
    }

    // Call Google Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: systemPrompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.8,
            topK: 50,
            topP: 0.9,
            maxOutputTokens: 2048,
            candidateCount: 1,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      }
    );

    if (!geminiResponse.ok) {
      console.error('Gemini API error:', await geminiResponse.text());
      return NextResponse.json(
        { success: false, message: 'Failed to generate message with AI' },
        { status: 500 }
      );
    }

    const geminiData = await geminiResponse.json();
    
    if (!geminiData.candidates || !geminiData.candidates[0] || !geminiData.candidates[0].content) {
      return NextResponse.json(
        { success: false, message: 'Invalid response from AI service' },
        { status: 500 }
      );
    }

    let generatedMessage = geminiData.candidates[0].content.parts[0].text;

    // Clean up any markdown formatting that might slip through
    generatedMessage = generatedMessage
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown **text**
      .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown *text*
      .replace(/^\* /gm, '- ') // Replace markdown bullets with dashes
      .replace(/^\* /gm, '- ') // Replace any remaining markdown bullets
      .replace(/\n\*\s/g, '\n- ') // Replace markdown bullets in middle of text
      .replace(/\*\s/g, '- ') // Replace any remaining markdown bullets
      .replace(/\n\n+/g, '\n\n') // Clean up multiple newlines
      .trim();

    return NextResponse.json({
      success: true,
      message: generatedMessage
    });

  } catch (error) {
    console.error('Error generating AI message:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while generating the message' },
      { status: 500 }
    );
  }
}
