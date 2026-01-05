import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AnalysisResult, AnalysisStage, Message } from "@/types/analysis";
import { toast } from "sonner";

interface AnalyzeInput {
  text?: string;
  imageBase64?: string;
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

      const { data, error } = await supabase.functions.invoke("analyze-ingredients", {
        body: {
          ingredients: imageBase64 ? undefined : (text || undefined),
          imageBase64: imageBase64 || undefined,
          type: imageBase64 ? "image" : "text",
          // Only treat the text as a "question" when the user is analyzing an image.
          // For plain text ingredient lists, sending userQuery caused 400s due to the 500-char limit.
          userQuery: imageBase64 ? (text || undefined) : undefined,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

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
      toast.error("Analysis failed. Please try again.");
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
      if (data.error) throw new Error(data.error);

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
