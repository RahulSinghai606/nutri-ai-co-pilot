import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation constants
const MAX_QUESTION_LENGTH = 1000;
const MAX_CONVERSATION_HISTORY = 10;
const MAX_CONTEXT_SIZE = 50000; // ~50KB for analysis context

interface Message {
  role: string;
  content: string;
}

function validateRequest(body: unknown): { 
  question: string; 
  analysisContext: unknown; 
  conversationHistory: Message[] 
} {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid request body");
  }

  const { question, analysisContext, conversationHistory } = body as Record<string, unknown>;

  // Validate question
  if (!question || typeof question !== "string") {
    throw new Error("Question is required");
  }
  if (question.trim().length === 0) {
    throw new Error("Question cannot be empty");
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    throw new Error("Question exceeds maximum length (1000 characters)");
  }

  // Validate analysisContext size
  const contextStr = JSON.stringify(analysisContext || {});
  if (contextStr.length > MAX_CONTEXT_SIZE) {
    throw new Error("Analysis context too large");
  }

  // Validate and limit conversation history
  let validHistory: Message[] = [];
  if (Array.isArray(conversationHistory)) {
    validHistory = conversationHistory
      .filter((msg): msg is Message => 
        typeof msg === "object" && 
        msg !== null &&
        typeof (msg as Message).role === "string" && 
        typeof (msg as Message).content === "string"
      )
      .slice(-MAX_CONVERSATION_HISTORY)
      .map(msg => ({
        role: msg.role,
        content: msg.content.slice(0, 2000) // Limit each message
      }));
  }

  return {
    question: question.trim(),
    analysisContext: analysisContext || {},
    conversationHistory: validHistory,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate request body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { question, analysisContext, conversationHistory } = validateRequest(body);
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("Service configuration error");
    }

    const systemPrompt = `You are NutriSense AI, a warm and knowledgeable food scientist. You're having a follow-up conversation about a food product the user just analyzed.

CONTEXT FROM ANALYSIS:
${JSON.stringify(analysisContext, null, 2)}

GUIDELINES:
- Respond in warm, conversational paragraphs (not bullet points)
- Show your reasoning: "I think [X] because [Y], though keep in mind [Z]..."
- Be honest about uncertainty
- Never make absolute health claims
- Reference specific ingredients from the analysis when relevant
- If asked about pregnancy, children, or medical conditions, always recommend consulting a healthcare provider
- Keep responses focused and helpful, typically 2-4 paragraphs

Use phrases like:
- "Based on what I see here..."
- "You might want to know..."
- "The research suggests..."
- "If you're concerned about..."`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: question }
    ];

    console.log("Processing chat request");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error("AI Gateway error:", response.status);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("Chat service temporarily unavailable");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response generated");
    }

    console.log("Chat response generated");

    return new Response(JSON.stringify({ response: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Error in chat-ingredients:", error);
    const message = error instanceof Error ? error.message : "Chat failed";
    // Only return specific validation errors
    const safeMessage = message.includes("exceeds") || message.includes("required") || message.includes("cannot be empty")
      ? message 
      : "Chat failed. Please try again.";
    return new Response(
      JSON.stringify({ error: safeMessage }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
