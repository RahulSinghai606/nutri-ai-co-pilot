import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, analysisContext, conversationHistory } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
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
      ...(conversationHistory || []),
      { role: "user", content: question }
    ];

    console.log("Chat request:", question);

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
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    console.log("Chat response generated");

    return new Response(JSON.stringify({ response: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Error in chat-ingredients:", error);
    const message = error instanceof Error ? error.message : "Chat failed";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
