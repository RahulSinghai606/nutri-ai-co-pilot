import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ingredients, imageBase64, type } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let userContent: any[];
    
    if (type === "image" && imageBase64) {
      // Image analysis
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
      // Text analysis
      userContent = [
        {
          type: "text",
          text: `Analyze these food ingredients:\n\n${ingredients}\n\nProvide a comprehensive analysis in the specified JSON format.`
        }
      ];
    }

    console.log("Sending request to Lovable AI Gateway...");
    console.log("Request type:", type || "text");

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
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
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
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No response from AI");
    }

    console.log("Raw AI response:", content.substring(0, 500));

    // Parse JSON from response (handle markdown code blocks)
    let analysisResult;
    try {
      // Remove markdown code blocks if present
      const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      analysisResult = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to parse AI response as JSON");
      }
    }

    // Add unique ID
    analysisResult.id = `analysis-${Date.now()}`;

    console.log("Analysis complete:", analysisResult.productName || "Unknown product");

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Error in analyze-ingredients:", error);
    const message = error instanceof Error ? error.message : "Analysis failed";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
