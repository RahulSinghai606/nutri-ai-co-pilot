import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AnalysisResult, AnalysisStage, Message } from "@/types/analysis";
import { toast } from "sonner";

interface AnalyzeInput {
  text?: string;
  imageBase64?: string;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1500;

// Helper to wait
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry wrapper for network requests
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES,
  delayMs = RETRY_DELAY_MS
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on validation errors or client errors
      if (lastError.message.includes("exceeds") || 
          lastError.message.includes("required") ||
          lastError.message.includes("Invalid") ||
          lastError.message.includes("cannot be empty")) {
        throw lastError;
      }
      
      console.log(`Attempt ${attempt + 1} failed, retrying...`, lastError.message);
      
      if (attempt < retries - 1) {
        await delay(delayMs * (attempt + 1)); // Exponential backoff
      }
    }
  }
  
  throw lastError || new Error("Request failed after retries");
}

export const useIngredientAnalysis = () => {
  const [analysisStage, setAnalysisStage] = useState<AnalysisStage>("none");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAITyping, setIsAITyping] = useState(false);

  const analyze = async (input: AnalyzeInput) => {
    const { text, imageBase64 } = input;
    
    if (!text && !imageBase64) {
      toast.error("Please provide ingredients text or an image");
      return;
    }

    setAnalysisStage("reading");
    setIngredients(imageBase64 ? ["Reading image..."] : (text?.split(/,|;|\n/).map(s => s.trim()).filter(Boolean) || []));

    try {
      // Progress through stages while waiting for AI
      setTimeout(() => setAnalysisStage("analyzing"), 1500);
      setTimeout(() => setAnalysisStage("reasoning"), 3000);

      const performAnalysis = async () => {
        const { data, error } = await supabase.functions.invoke("analyze-ingredients", {
          body: {
            ingredients: imageBase64 ? undefined : (text || undefined),
            imageBase64: imageBase64 || undefined,
            type: imageBase64 ? "image" : "text",
            userQuery: imageBase64 ? (text || undefined) : undefined,
          },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        
        return data;
      };

      // Use retry wrapper for the API call
      const data = await withRetry(performAnalysis);

      // Extract ingredients from result for display
      if (imageBase64) {
        const allIngredients = data.categories?.flatMap(
          (cat: { ingredients: { commonName: string }[] }) => 
            cat.ingredients.map((i) => i.commonName)
        ) || [];
        setIngredients(allIngredients);
      }

      setAnalysisStage("complete");
      setAnalysisResult(data);
    } catch (error) {
      console.error("Analysis failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Analysis failed";
      
      // Provide helpful error messages
      if (errorMessage.includes("Rate limit")) {
        toast.error("Too many requests. Please wait a moment and try again.");
      } else if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
        toast.error("Network error. Please check your connection and try again.");
      } else if (errorMessage.includes("timeout") || errorMessage.includes("Timeout")) {
        toast.error("Request timed out. Please try again.");
      } else {
        toast.error("Analysis failed. Please try again.");
      }
      
      setAnalysisStage("none");
      setIngredients([]);
    }
  };

  const sendMessage = async (message: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsAITyping(true);

    try {
      const performChat = async () => {
        const { data, error } = await supabase.functions.invoke("chat-ingredients", {
          body: {
            question: message,
            analysisContext: analysisResult,
            conversationHistory: messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        
        return data;
      };

      // Use retry wrapper for chat as well
      const data = await withRetry(performChat, 2); // Fewer retries for chat

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat failed:", error);
      toast.error("Failed to get response. Please try again.");
    } finally {
      setIsAITyping(false);
    }
  };

  const reset = () => {
    setAnalysisStage("none");
    setAnalysisResult(null);
    setIngredients([]);
    setMessages([]);
  };

  return {
    analysisStage,
    analysisResult,
    ingredients,
    messages,
    isAITyping,
    analyze,
    sendMessage,
    reset,
  };
};
