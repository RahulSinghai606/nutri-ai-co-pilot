import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AnalysisResult, AnalysisStage, Message } from "@/types/analysis";
import { toast } from "sonner";

export const useIngredientAnalysis = () => {
  const [analysisStage, setAnalysisStage] = useState<AnalysisStage>("none");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAITyping, setIsAITyping] = useState(false);

  const parseIngredients = (text: string): string[] => {
    return text
      .split(/,|;|\n/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  };

  const analyzeText = async (input: string) => {
    const parsed = parseIngredients(input);
    setIngredients(parsed);
    setAnalysisStage("reading");

    try {
      // Progress through stages while waiting for AI
      setTimeout(() => setAnalysisStage("analyzing"), 1500);
      setTimeout(() => setAnalysisStage("reasoning"), 3000);

      const { data, error } = await supabase.functions.invoke("analyze-ingredients", {
        body: { ingredients: input, type: "text" },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setAnalysisStage("complete");
      setAnalysisResult(data);
    } catch (error) {
      console.error("Analysis failed:", error);
      toast.error("Analysis failed. Please try again.");
      setAnalysisStage("none");
      setIngredients([]);
    }
  };

  const analyzeImage = async (file: File) => {
    setAnalysisStage("reading");
    setIngredients(["Reading image..."]);

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setTimeout(() => setAnalysisStage("analyzing"), 1500);
      setTimeout(() => setAnalysisStage("reasoning"), 3500);

      const { data, error } = await supabase.functions.invoke("analyze-ingredients", {
        body: { imageBase64: base64, type: "image" },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      // Extract ingredients from result for display
      const allIngredients = data.categories?.flatMap(
        (cat: { ingredients: { commonName: string }[] }) => 
          cat.ingredients.map((i) => i.commonName)
      ) || [];
      setIngredients(allIngredients);

      setAnalysisStage("complete");
      setAnalysisResult(data);
    } catch (error) {
      console.error("Image analysis failed:", error);
      toast.error("Image analysis failed. Please try again.");
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
    analyzeText,
    analyzeImage,
    sendMessage,
    reset,
  };
};
