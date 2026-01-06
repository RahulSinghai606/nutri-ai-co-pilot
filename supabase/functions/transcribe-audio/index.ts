import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Allowed origins for monitoring (add your production domains here)
const KNOWN_ORIGINS = [
  "lovableproject.com",
  "lovable.app",
  "localhost",
];

function logOrigin(req: Request) {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  
  if (origin) {
    const isKnownOrigin = KNOWN_ORIGINS.some(known => origin.includes(known));
    if (!isKnownOrigin) {
      console.warn("Request from external origin:", origin, "referer:", referer);
    }
  }
}

// Input validation constants
const MAX_AUDIO_BASE64_LENGTH = 13_000_000; // ~10MB decoded

function validateRequest(body: unknown): { audioBase64: string } {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid request body");
  }

  const { audioBase64 } = body as Record<string, unknown>;

  if (!audioBase64 || typeof audioBase64 !== "string") {
    throw new Error("Audio data is required");
  }

  if (audioBase64.length > MAX_AUDIO_BASE64_LENGTH) {
    throw new Error("Audio size exceeds maximum allowed (10MB)");
  }

  if (audioBase64.trim().length === 0) {
    throw new Error("Audio data cannot be empty");
  }

  // Basic base64 validation
  const base64Pattern = /^[A-Za-z0-9+/=]+$/;
  if (!base64Pattern.test(audioBase64.substring(0, 100))) {
    throw new Error("Invalid audio format");
  }

  return { audioBase64 };
}

serve(async (req) => {
  // Log origin for monitoring
  logOrigin(req);

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

    const { audioBase64 } = validateRequest(body);
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("Service configuration error");
    }

    console.log("Processing transcription request");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "This is an audio recording of someone describing food ingredients or asking about a food product. Please transcribe what they said. If it's about food ingredients, extract the ingredient list. Only return the transcription, nothing else."
              },
              {
                type: "input_audio",
                input_audio: {
                  data: audioBase64,
                  format: "webm"
                }
              }
            ]
          }
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      console.error("AI Gateway error:", response.status);
      throw new Error("Transcription service temporarily unavailable");
    }

    const data = await response.json();
    const transcription = data.choices?.[0]?.message?.content;

    if (!transcription) {
      throw new Error("No transcription generated");
    }

    console.log("Transcription complete");

    return new Response(JSON.stringify({ text: transcription }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Error in transcribe-audio:", error);
    const message = error instanceof Error ? error.message : "Transcription failed";
    // Only return specific validation errors
    const safeMessage = message.includes("exceeds") || message.includes("required") || message.includes("cannot be empty") || message.includes("Invalid")
      ? message 
      : "Transcription failed. Please try again.";
    return new Response(
      JSON.stringify({ error: safeMessage }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
