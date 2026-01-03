import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { Header, HowItWorks, Footer } from "@/components/Layout";
import { FloatingBlobs } from "@/components/FloatingBlobs";
import { InputBox } from "@/components/InputBox";
import { DemoSelector } from "@/components/DemoSelector";
import { ThinkingAnimation } from "@/components/ThinkingAnimation";
import { VerdictCard } from "@/components/VerdictCard";
import { IngredientBreakdown } from "@/components/IngredientBreakdown";
import { TradeoffsCard } from "@/components/TradeoffsCard";
import { ConversationPanel } from "@/components/ConversationPanel";
import { Button } from "@/components/ui/button";
import { demoScenarios, suggestedQuestions } from "@/data/demoData";
import { AnalysisResult, AnalysisStage, Message } from "@/types/analysis";

const Index = () => {
  const [analysisStage, setAnalysisStage] = useState<AnalysisStage>("none");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConversationOpen, setIsConversationOpen] = useState(false);
  const [isAITyping, setIsAITyping] = useState(false);

  const parseIngredients = (text: string): string[] => {
    return text
      .split(/,|;|\n/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  };

  const simulateAnalysis = (input: string, result: AnalysisResult) => {
    const parsed = parseIngredients(input);
    setIngredients(parsed);
    
    // Start analysis stages
    setAnalysisStage("reading");
    
    setTimeout(() => setAnalysisStage("analyzing"), 2000);
    setTimeout(() => setAnalysisStage("reasoning"), 4000);
    setTimeout(() => {
      setAnalysisStage("complete");
      setAnalysisResult(result);
    }, 5500);
  };

  const handleSubmit = (input: string) => {
    // Check if input matches a demo scenario
    const matchedDemo = demoScenarios.find(
      (demo) => 
        input.toLowerCase().includes(demo.name.toLowerCase()) ||
        demo.input.toLowerCase().includes(input.toLowerCase().slice(0, 50))
    );

    if (matchedDemo) {
      simulateAnalysis(matchedDemo.input, matchedDemo.result);
    } else {
      // For non-demo inputs, use Doritos as fallback (in real app, would call AI)
      simulateAnalysis(input, demoScenarios[0].result);
    }
  };

  const handleSelectDemo = (demo: typeof demoScenarios[0]) => {
    simulateAnalysis(demo.input, demo.result);
  };

  const handleReset = () => {
    setAnalysisStage("none");
    setAnalysisResult(null);
    setIngredients([]);
    setMessages([]);
    setIsConversationOpen(false);
  };

  const handleSendMessage = (message: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setIsAITyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponses: Record<string, string> = {
        "Is this okay for kids?": `That's a thoughtful question to ask as a parent. For children, there are a few things worth noting about this product:

The artificial colors (Yellow 5, 6, and Red 40) are the main concern for kids. Some studies have linked these dyes to hyperactivity in children, which is why the EU requires warning labels. The US doesn't require warnings, but some pediatricians recommend limiting artificial colors.

MSG is generally considered safe for children at normal consumption levels.

My suggestion: As an occasional snack, this is fine for most kids. If you notice behavioral changes after eating brightly colored snacks, it might be worth trying naturally-colored alternatives.`,
        "What's the worst ingredient?": `If I had to pick the most controversial ingredients here, I'd point to the artificial colors - specifically Yellow 5 (Tartrazine), Yellow 6, and Red 40.

Here's why: These are petroleum-derived synthetic dyes that are banned or require warning labels in several European countries. Research linking them to hyperactivity in children is mixed but concerning enough that some countries have taken precautionary action.

That said, "worst" is relative. At typical consumption levels, the FDA considers them safe. If you're eating Doritos occasionally, these ingredients aren't likely to cause harm. The concern grows if you're consuming multiple artificially-colored products daily.`,
        "default": `That's a great question! Based on my analysis of these ingredients, I'd say the answer depends on your specific situation and concerns.

The key things to consider are the artificial colors and flavor enhancers. While FDA-approved, some people prefer to avoid these ingredients, especially for children or those with sensitivities.

Is there anything specific about these ingredients you'd like me to explain further?`,
      };

      const response = aiResponses[message] || aiResponses["default"];
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, aiMessage]);
      setIsAITyping(false);
    }, 2000);
  };

  const showResults = analysisStage === "complete" && analysisResult;

  return (
    <div className="min-h-screen relative">
      <FloatingBlobs />
      <Header />

      <main className="relative z-10">
        <AnimatePresence mode="wait">
          {analysisStage === "none" ? (
            <motion.div
              key="hero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-screen flex flex-col"
            >
              {/* Hero Section */}
              <section className="flex-1 flex flex-col items-center justify-center px-4 pt-24 pb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-center mb-8"
                >
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                    AI-Powered Ingredient Analysis
                  </span>
                  
                  <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-foreground mb-4 leading-tight">
                    Understand What You Eat
                    <br />
                    <span className="text-primary">In Seconds, Not Hours</span>
                  </h1>
                  
                  <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                    Your AI food intelligence companion — no forms, no filters, just answers.
                  </p>
                </motion.div>

                <InputBox onSubmit={handleSubmit} />
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-wrap items-center justify-center gap-4 mt-8 text-sm text-muted-foreground"
                >
                  <span className="flex items-center gap-1.5">✓ No signup</span>
                  <span className="flex items-center gap-1.5">✓ Private</span>
                  <span className="flex items-center gap-1.5">✓ Instant insights</span>
                </motion.div>

                <DemoSelector onSelectDemo={handleSelectDemo} />
              </section>

              <HowItWorks />
              <Footer />
            </motion.div>
          ) : showResults ? (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-screen pt-24 pb-12"
            >
              <div className="max-w-5xl mx-auto px-4">
                {/* Back button */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mb-6"
                >
                  <Button
                    variant="ghost"
                    onClick={handleReset}
                    className="gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Analyze another
                  </Button>
                </motion.div>

                {/* Product name */}
                {analysisResult.productName && (
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="font-display text-3xl md:text-4xl text-foreground mb-8"
                  >
                    {analysisResult.productName}
                  </motion.h1>
                )}

                {/* Results layout */}
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Main content */}
                  <div className="flex-1 space-y-6">
                    <VerdictCard
                      verdict={analysisResult.verdict}
                      confidence={analysisResult.confidence}
                      summary={analysisResult.summary}
                      contextNote={analysisResult.contextNote}
                      detectedContext={analysisResult.detectedContext}
                    />

                    <IngredientBreakdown categories={analysisResult.categories} />

                    {analysisResult.tradeoffs.length > 0 && (
                      <TradeoffsCard tradeoffs={analysisResult.tradeoffs} />
                    )}
                  </div>

                  {/* Conversation panel - desktop */}
                  <div className="hidden lg:block w-96">
                    <div className="sticky top-24">
                      <div className="glass-card rounded-2xl overflow-hidden h-[600px]">
                        <ConversationPanel
                          messages={messages}
                          suggestedQuestions={suggestedQuestions}
                          onSendMessage={handleSendMessage}
                          isLoading={isAITyping}
                          isOpen={true}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile conversation panel */}
                <div className="lg:hidden">
                  <ConversationPanel
                    messages={messages}
                    suggestedQuestions={suggestedQuestions}
                    onSendMessage={handleSendMessage}
                    isLoading={isAITyping}
                    isOpen={isConversationOpen}
                    onToggle={() => setIsConversationOpen(!isConversationOpen)}
                  />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="thinking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-screen flex items-center justify-center px-4 pt-24"
            >
              <ThinkingAnimation stage={analysisStage} ingredients={ingredients} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Index;
