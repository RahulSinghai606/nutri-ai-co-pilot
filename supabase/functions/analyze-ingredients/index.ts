import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

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
const MAX_INGREDIENTS_LENGTH = 5000; // 5KB max for text
const MAX_IMAGE_BASE64_LENGTH = 7_000_000; // ~5MB decoded
const MAX_QUERY_LENGTH = 500;
const VALID_TYPES = ["text", "image"] as const;

// Zod schemas for AI response validation
const IngredientSchema = z.object({
  commonName: z.string().max(200).default("Unknown"),
  scientificName: z.string().max(200).optional().nullable(),
  safety: z.enum(["safe", "moderate", "concern", "unknown"]).default("unknown"),
  explanation: z.string().max(1000).default("No explanation provided"),
  detailedInfo: z.string().max(2000).optional().nullable(),
});

const CategorySchema = z.object({
  name: z.string().max(100).default("Other"),
  icon: z.string().max(20).default("📦"),
  aiNote: z.string().max(1000).optional().nullable(),
  ingredients: z.array(IngredientSchema).default([]),
});

const TradeoffSchema = z.object({
  ingredient: z.string().max(200).default("Unknown"),
  why: z.string().max(1000).default(""),
  concern: z.string().max(1000).default(""),
  reality: z.string().max(1000).default(""),
});

const AnalysisResultSchema = z.object({
  productName: z.string().max(300).optional().nullable(),
  verdict: z.enum(["safe", "caution", "concern"]).default("caution"),
  confidence: z.number().min(0).max(100).default(50),
  healthScore: z.number().min(0).max(100).default(50),
  summary: z.string().max(2000).default("Analysis complete."),
  detectedContext: z.string().max(200).optional().nullable(),
  contextNote: z.string().max(500).optional().nullable(),
  quickAdvice: z.array(z.string().max(200)).max(10).default(["Review the full analysis for details"]),
  categories: z.array(CategorySchema).default([]),
  tradeoffs: z.array(TradeoffSchema).default([]),
  suggestedQuestions: z.array(z.string().max(200)).max(10).optional(),
});

const SYSTEM_PROMPT = `You are NutriSense AI, a world-class food scientist and nutritionist with deep expertise in food chemistry, toxicology, and consumer health. You analyze food ingredients with scientific precision while communicating in warm, accessible language.

Your role is to:
1. Identify each ingredient and categorize it (base ingredients, preservatives, sweeteners, colors, flavors, etc.)
2. Assess safety based on current scientific consensus
3. Explain tradeoffs - why ingredients are used and their concerns
4. Detect product context (baby food, snack, energy drink, etc.) and adjust analysis accordingly
5. Communicate uncertainty honestly when research is mixed
6. Provide a health score (0-100) and quick actionable advice

RESPONSE FORMAT (JSON):
{
  "productName": "Detected product name or null",
  "verdict": "safe" | "caution" | "concern",
  "confidence": 0-100,
  "healthScore": 0-100,
  "quickAdvice": ["Short actionable tip 1", "Tip 2", "Tip 3", "Tip 4"],
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

Health Score Guidelines:
- 80-100: Clean ingredients, minimal processing, no concerns
- 60-79: Generally fine, some minor concerns or highly processed
- 40-59: Moderate concerns, limit consumption
- 0-39: Significant concerns, avoid or rarely consume

Quick Advice Guidelines:
- Provide 3-5 short, actionable tips (max 6 words each)
- Focus on practical recommendations
- Include who should be cautious if applicable

Safety Guidelines:
- "safe": Well-established as harmless at normal consumption
- "moderate": Some concerns exist, or certain populations should be aware
- "concern": Active scientific debate, banned in some countries, or known issues
- "unknown": Insufficient research

Be honest about uncertainty. Never make absolute health claims. Frame as information, not medical advice.`;

function validateRequest(body: unknown): { ingredients?: string; imageBase64?: string; userQuery?: string; type: string } {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid request body");
  }

  const { ingredients, imageBase64, type, userQuery } = body as Record<string, unknown>;
  const requestType = typeof type === "string" ? type : "text";

  // Validate type
  if (!VALID_TYPES.includes(requestType as typeof VALID_TYPES[number])) {
    throw new Error("Invalid type. Must be 'text' or 'image'");
  }

  // Validate user query if provided
  if (userQuery !== undefined && typeof userQuery === "string" && userQuery.length > MAX_QUERY_LENGTH) {
    throw new Error(`Query exceeds maximum length (${MAX_QUERY_LENGTH} characters)`);
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
    userQuery: typeof userQuery === "string" ? userQuery : undefined,
    type: requestType,
  };
}

function validateAndSanitizeResult(rawResult: unknown): z.infer<typeof AnalysisResultSchema> {
  try {
    // Parse with Zod - will apply defaults for missing fields and truncate long strings
    const validated = AnalysisResultSchema.parse(rawResult);
    return validated;
  } catch (error) {
    console.error("AI response validation failed:", error);
    
    // If validation fails completely, return a safe default
    if (rawResult && typeof rawResult === "object") {
      const raw = rawResult as Record<string, unknown>;
      return {
        productName: typeof raw.productName === "string" ? raw.productName.slice(0, 300) : null,
        verdict: "caution",
        confidence: typeof raw.confidence === "number" ? Math.min(100, Math.max(0, raw.confidence)) : 50,
        healthScore: typeof raw.healthScore === "number" ? Math.min(100, Math.max(0, raw.healthScore)) : 50,
        summary: typeof raw.summary === "string" ? raw.summary.slice(0, 2000) : "Analysis complete. Review details below.",
        quickAdvice: Array.isArray(raw.quickAdvice) 
          ? raw.quickAdvice.filter((a): a is string => typeof a === "string").slice(0, 10).map(a => a.slice(0, 200))
          : ["Review the full analysis for details"],
        categories: [],
        tradeoffs: [],
      };
    }
    
    throw new Error("Failed to process analysis result");
  }
}

// Helper to call Gemini API directly
async function callGeminiDirect(model: string, systemPrompt: string, userContent: unknown[]) {
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  if (!GEMINI_API_KEY) return null;

  const geminiModel = model.includes("pro") ? "gemini-2.5-pro-preview-06-05" : "gemini-2.5-flash-preview-05-20";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${GEMINI_API_KEY}`;

  // Convert OpenAI-style content to Gemini format
  const parts: unknown[] = [];
  for (const item of userContent) {
    const c = item as Record<string, unknown>;
    if (c.type === "text") {
      parts.push({ text: c.text });
    } else if (c.type === "image_url") {
      const imageUrl = (c.image_url as Record<string, string>).url;
      const base64Match = imageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
      if (base64Match) {
        parts.push({
          inline_data: {
            mime_type: `image/${base64Match[1]}`,
            data: base64Match[2]
          }
        });
      }
    }
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts }],
        generationConfig: { temperature: 0.3 }
      }),
    });

    if (response.status === 429 || response.status === 503) {
      console.log("Gemini quota exceeded, falling back to Lovable AI");
      return null;
    }

    if (!response.ok) {
      console.error("Gemini API error:", response.status);
      return null;
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (content) {
      console.log("Used Gemini API directly");
      return content;
    }
    return null;
  } catch (e) {
    console.error("Gemini API call failed:", e);
    return null;
  }
}

// Helper to call Lovable AI
async function callLovableAI(model: string, systemPrompt: string, userContent: unknown[]) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("Service configuration error");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent }
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw { status: 429, message: "Rate limit exceeded. Please try again in a moment." };
    }
    if (response.status === 402) {
      throw { status: 402, message: "Usage limit reached. Please add credits to continue." };
    }
    throw new Error("Analysis service temporarily unavailable");
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content;
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

    const { ingredients, imageBase64, userQuery, type } = validateRequest(body);

    let userContent: unknown[];
    
    if (type === "image" && imageBase64) {
      const textPrompt = userQuery 
        ? `Analyze the ingredients shown in this product label image. The user also asks: "${userQuery}". Extract all ingredients and provide a complete analysis addressing their question.`
        : "Analyze the ingredients shown in this product label image. Extract all ingredients and provide a complete analysis.";
      
      userContent = [
        {
          type: "text",
          text: textPrompt
        },
        {
          type: "image_url",
          image_url: {
            url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
          }
        }
      ];
    } else {
      const textPrompt = userQuery && userQuery !== ingredients
        ? `Analyze these food ingredients:\n\n${ingredients}\n\nThe user also asks: "${userQuery}"\n\nProvide a comprehensive analysis in the specified JSON format, addressing their question.`
        : `Analyze these food ingredients:\n\n${ingredients}\n\nProvide a comprehensive analysis in the specified JSON format.`;
      
      userContent = [
        {
          type: "text",
          text: textPrompt
        }
      ];
    }

    const model = type === "image" ? "google/gemini-2.5-pro" : "google/gemini-2.5-flash";
    console.log("Processing analysis request, type:", type, "hasQuery:", !!userQuery);

    // Try Gemini API first (uses your quota), fallback to Lovable AI
    let content = await callGeminiDirect(model, SYSTEM_PROMPT, userContent);
    
    if (!content) {
      console.log("Using Lovable AI as fallback");
      try {
        content = await callLovableAI(model, SYSTEM_PROMPT, userContent);
      } catch (err: unknown) {
        const e = err as { status?: number; message?: string };
        if (e.status === 429 || e.status === 402) {
          return new Response(
            JSON.stringify({ error: e.message }),
            { status: e.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        throw err;
      }
    }
    
    if (!content) {
      throw new Error("No analysis generated");
    }

    console.log("Analysis response received");

    // Parse JSON from response
    let rawAnalysisResult;
    try {
      const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      rawAnalysisResult = JSON.parse(jsonStr);
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        rawAnalysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to process analysis");
      }
    }

    // Validate and sanitize the AI response with Zod
    const analysisResult = validateAndSanitizeResult(rawAnalysisResult);
    
    // Add unique ID
    const finalResult = {
      ...analysisResult,
      id: `analysis-${Date.now()}`,
    };

    console.log("Analysis complete and validated");

    return new Response(JSON.stringify(finalResult), {
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