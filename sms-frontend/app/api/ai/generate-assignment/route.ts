import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured in .env' }, { status: 500 });
    }

    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    // Prepare history for Gemini. We need to convert our frontend role 'user' / 'ai' 
    // to Gemini's 'user' / 'model' roles. We exclude the very last user message to use as the prompt.
    let history = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    // Gemini API requires the history to start with a 'user' message.
    // If the first message is our AI welcome message, remove it from the history sent to Gemini.
    if (history.length > 0 && history[0].role === 'model') {
      history.shift();
    }

    const lastMessage = messages[messages.length - 1];

    // Use Gemini 1.5 Pro for complex reasoning and structured output
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

    const systemInstruction = `
You are an expert teacher's assistant agent. Your primary role is to help a teacher draft comprehensive, high-quality assignments based on their natural language requests.
If the teacher is vague or provides incomplete text (e.g. "make a quiz on cells"), you MUST use your expertise to infer their motive and automatically write a proper, academic, beautifully formatted description with detailed questions.

CRITICAL TONE REQUIREMENT:
The assignment description MUST be written with a clear, positive, supportive, and student-friendly tone.
- Avoid rigid, harsh, or demanding language.
- Frame the assignment as an engaging learning opportunity.
- Use encouraging words (e.g., "In this assignment, you will have the opportunity to explore...", "We look forward to seeing your insights on...").
- Keep instructions crystal clear but warmly supportive.

Format Requirements:
When drafting an assignment, ALWAYS use rich HTML tags (e.g., <h2>, <h3>, <p>, <ul>, <li>, <strong>) in the 'description' field so it looks like a beautiful mini-document. If the teacher asks for specific questions or topics, write the full questions out in this description using HTML formatting.

Output format:
You must ALWAYS respond with a pure JSON object (do not wrap in markdown \`\`\`json block).
The JSON object must strictly match this TypeScript interface:
{
  "isDraft": true,
  "chatResponse": "A friendly conversational response accompanying the draft, e.g. 'Here is a comprehensive draft based on your request...'",
  "draftData": {
    "title": string (A concise, academic title),
    "description": string (The beautifully formatted HTML description containing instructions, questions, headers, etc.),
    "totalMarks": number (Infer a reasonable total, e.g. 50 or 100),
    "dueDate": string (An ISO date string, typically 7 days from now),
    "allowLateSubmissions": boolean (Default false)
  }
}

If the user is just saying 'hello' or asking a clarifying question where a draft isn't appropriate yet, respond with:
{
  "isDraft": false,
  "chatResponse": "Your helpful response here."
}
`;

    // Start a chat session
    const chat = model.startChat({
      history: history,
      systemInstruction: { parts: [{ text: systemInstruction }], role: 'system' },
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    // Send the last message
    const result = await chat.sendMessage(lastMessage.content);
    const responseText = result.response.text();

    // Parse the JSON strictly
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse Gemini response as JSON:", responseText);
      return NextResponse.json({ error: 'AI returned invalid JSON format' }, { status: 500 });
    }

    return NextResponse.json(parsedData);

  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate AI response' }, { status: 500 });
  }
}
