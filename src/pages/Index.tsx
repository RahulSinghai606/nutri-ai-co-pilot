import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { Header, HowItWorks, About, Footer } from "@/components/Layout";
import { FloatingBlobs } from "@/components/FloatingBlobs";
import { InputBox } from "@/components/InputBox";
import { DemoSelector } from "@/components/DemoSelector";
import { ThinkingAnimation } from "@/components/ThinkingAnimation";
import { VerdictCard } from "@/components/VerdictCard";
import { IngredientBreakdown } from "@/components/IngredientBreakdown";
import { TradeoffsCard } from "@/components/TradeoffsCard";
import { ConversationPanel } from "@/components/ConversationPanel";
import { HealthScoreCard } from "@/components/HealthScoreCard";
import { ShareButton } from "@/components/ShareButton";
import { Button } from "@/components/ui/button";
import { demoScenarios, suggestedQuestions } from "@/data/demoData";
import { useIngredientAnalysis } from "@/hooks/useIngredientAnalysis";

const Index = () => {
  const {
    analysisStage,
    analysisResult,
    ingredients,
    messages,
    isAITyping,
    analyze,
    sendMessage,
    reset,
  } = useIngredientAnalysis();

  const [isConversationOpen, setIsConversationOpen] = useState(false);
  const [showFullAnalysis, setShowFullAnalysis] = useState(false);

  const handleSelectDemo = (demo: typeof demoScenarios[0]) => {
    analyze({ text: demo.input });
  };

  const handleAnalyze = (input: { text?: string; imageBase64?: string }) => {
    setShowFullAnalysis(false);
    analyze(input);
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

                <InputBox onAnalyze={handleAnalyze} isProcessing={analysisStage !== "none"} />
                
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
              <About />
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
                {/* Back button and share */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mb-6 flex items-center justify-between"
                >
                  <Button
                    variant="ghost"
                    onClick={reset}
                    className="gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Analyze another
                  </Button>
                  <ShareButton analysis={analysisResult} />
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

                {/* Health Score Card - Quick View */}
                {!showFullAnalysis && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6"
                  >
                    <HealthScoreCard
                      score={analysisResult.healthScore || Math.round(analysisResult.confidence * 0.9)}
                      verdict={analysisResult.verdict}
                      quickAdvice={analysisResult.quickAdvice || ["Check full analysis for details"]}
                      summary={analysisResult.summary}
                      onShowDetails={() => setShowFullAnalysis(true)}
                    />
                  </motion.div>
                )}

                {/* Full Analysis */}
                <AnimatePresence>
                  {showFullAnalysis && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
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
                                onSendMessage={sendMessage}
                                isLoading={isAITyping}
                                isOpen={true}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Mobile conversation panel */}
                      <div className="lg:hidden mt-6">
                        <ConversationPanel
                          messages={messages}
                          suggestedQuestions={suggestedQuestions}
                          onSendMessage={sendMessage}
                          isLoading={isAITyping}
                          isOpen={isConversationOpen}
                          onToggle={() => setIsConversationOpen(!isConversationOpen)}
                        />
                      </div>

                      {/* Collapse button */}
                      <motion.div
                        className="flex justify-center mt-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <Button
                          variant="ghost"
                          onClick={() => setShowFullAnalysis(false)}
                          className="gap-2 text-muted-foreground"
                        >
                          <ChevronDown className="w-4 h-4 rotate-180" />
                          Show Quick View
                        </Button>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
