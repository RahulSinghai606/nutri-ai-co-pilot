import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation constants
const MAX_INGREDIENTS_LENGTH = 5000; // 5KB max for text
const MAX_IMAGE_BASE64_LENGTH = 7_000_000; // ~5MB decoded
const VALID_TYPES = ["text", "image"] as const;

const SYSTEM_PROMPT = `You are NutriSense AI, a world-class food scientist and nutritionist with deep expertise in food chemistry, toxicology, and consumer health. You analyze food ingredients with scientific precision while communicating in warm, accessible language.

Your role is to:
1. Identify each ingredient and categorize it (base ingredients, preservatives, sweeteners, colors, flavors, etc.)
2. Assess safety based on current scientific consensus
3. Explain tradeoffs - why ingredients are used and their concerns
4. Detect product context (baby food, snack, energy drink, etc.) and adjust analysis accordingly
5. Communicate uncertainty honestly when research is mixed

RESPONSE FORMAT (JSON):
{
  "productName": "Detected product name or null",
  "verdict": "safe" | "caution" | "concern",
  "confidence": 0-100,
  "summary": "2-3 sentence natural language summary",
  "detectedContext": "Product type you detected",
  "contextNote": "Why you focused on certain aspects",
  "categories": [
    {
      "name": "Category Name",
      "icon": "emoji",
      "aiNote": "Optional note for concerning categories",
      "ingredients": [
        {
          "commonName": "Name",
          "scientificName": "Optional scientific name",
          "explanation": "One line explanation",
          "safety": "safe" | "moderate" | "concern" | "unknown",
          "detailedInfo": "Optional deeper explanation"
        }
      ]
    }
  ],
  "tradeoffs": [
    {
      "ingredient": "Name",
      "why": "Why it's used",
      "concern": "What the concern is",
      "reality": "Balanced view"
    }
  ]
}

Safety Guidelines:
- "safe": Well-established as harmless at normal consumption
- "moderate": Some concerns exist, or certain populations should be aware
- "concern": Active scientific debate, banned in some countries, or known issues
- "unknown": Insufficient research

Be honest about uncertainty. Never make absolute health claims. Frame as information, not medical advice.`;

function validateRequest(body: unknown): { ingredients?: string; imageBase64?: string; type: string } {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid request body");
  }

  const { ingredients, imageBase64, type } = body as Record<string, unknown>;
  const requestType = typeof type === "string" ? type : "text";

  // Validate type
  if (!VALID_TYPES.includes(requestType as typeof VALID_TYPES[number])) {
    throw new Error("Invalid type. Must be 'text' or 'image'");
  }

  // Validate based on type
  if (requestType === "image") {
    if (!imageBase64 || typeof imageBase64 !== "string") {
      throw new Error("Image data is required for image analysis");
    }
    if (imageBase64.length > MAX_IMAGE_BASE64_LENGTH) {
      throw new Error("Image size exceeds maximum allowed (5MB)");
    }
    // Basic base64 format validation
    const base64Pattern = /^(data:image\/[a-z]+;base64,)?[A-Za-z0-9+/=]+$/;
    const dataToCheck = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");
    if (!base64Pattern.test(dataToCheck.substring(0, 100))) {
      throw new Error("Invalid image format");
    }
  } else {
    if (!ingredients || typeof ingredients !== "string") {
      throw new Error("Ingredients text is required");
    }
    if (ingredients.length > MAX_INGREDIENTS_LENGTH) {
      throw new Error("Ingredients text exceeds maximum length (5000 characters)");
    }
    if (ingredients.trim().length === 0) {
      throw new Error("Ingredients text cannot be empty");
    }
  }

  return {
    ingredients: typeof ingredients === "string" ? ingredients : undefined,
    imageBase64: typeof imageBase64 === "string" ? imageBase64 : undefined,
    type: requestType,
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

    const { ingredients, imageBase64, type } = validateRequest(body);
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("Service configuration error");
    }

    let userContent: unknown[];
    
    if (type === "image" && imageBase64) {
      userContent = [
        {
          type: "text",
          text: "Analyze the ingredients shown in this product label image. Extract all ingredients and provide a complete analysis."
        },
        {
          type: "image_url",
          image_url: {
            url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
          }
        }
      ];
    } else {
      userContent = [
        {
          type: "text",
          text: `Analyze these food ingredients:\n\n${ingredients}\n\nProvide a comprehensive analysis in the specified JSON format.`
        }
      ];
    }

    console.log("Processing analysis request, type:", type);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: type === "image" ? "google/gemini-2.5-pro" : "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent }
        ],
        temperature: 0.3,
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
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("Analysis service temporarily unavailable");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No analysis generated");
    }

    console.log("Analysis response received");

    // Parse JSON from response
    let analysisResult;
    try {
      const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      analysisResult = JSON.parse(jsonStr);
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to process analysis");
      }
    }

    analysisResult.id = `analysis-${Date.now()}`;

    console.log("Analysis complete");

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Error in analyze-ingredients:", error);
    // Return generic error message to client
    const message = error instanceof Error ? error.message : "Analysis failed";
    // Only return specific validation errors, not internal details
    const safeMessage = message.includes("exceeds") || message.includes("required") || message.includes("Invalid") || message.includes("cannot be empty")
      ? message 
      : "Analysis failed. Please try again.";
    return new Response(
      JSON.stringify({ error: safeMessage }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
