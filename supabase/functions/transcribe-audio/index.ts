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
    const { audioBase64 } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!audioBase64) {
      throw new Error("No audio data provided");
    }

    console.log("Transcribing audio...");

    // Use Gemini for audio transcription with text description
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
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`Transcription failed: ${response.status}`);
    }

    const data = await response.json();
    const transcription = data.choices?.[0]?.message?.content;

    if (!transcription) {
      throw new Error("No transcription generated");
    }

    console.log("Transcription complete:", transcription.substring(0, 100));

    return new Response(JSON.stringify({ text: transcription }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Error in transcribe-audio:", error);
    const message = error instanceof Error ? error.message : "Transcription failed";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
