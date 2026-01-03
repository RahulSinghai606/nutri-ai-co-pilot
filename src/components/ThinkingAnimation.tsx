import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Search, Sparkles, CheckCircle } from "lucide-react";

interface ThinkingAnimationProps {
  stage: "reading" | "analyzing" | "reasoning" | "complete";
  ingredients?: string[];
  onComplete?: () => void;
}

export const ThinkingAnimation = ({ stage, ingredients = [], onComplete }: ThinkingAnimationProps) => {
  const [currentIngredient, setCurrentIngredient] = useState(0);
  const [thoughts] = useState([
    "Reading ingredient list...",
    "Identifying additives and preservatives...",
    "Cross-referencing health research...",
    "Considering nutritional context...",
    "Evaluating safety profiles...",
    "Formulating assessment...",
  ]);
  const [currentThought, setCurrentThought] = useState(0);

  useEffect(() => {
    if (stage === "reading" && ingredients.length > 0) {
      const interval = setInterval(() => {
        setCurrentIngredient((prev) => {
          if (prev >= ingredients.length - 1) {
            clearInterval(interval);
            return prev;
          }
          return prev + 1;
        });
      }, 150);
      return () => clearInterval(interval);
    }
  }, [stage, ingredients]);

  useEffect(() => {
    if (stage === "analyzing" || stage === "reasoning") {
      const interval = setInterval(() => {
        setCurrentThought((prev) => (prev + 1) % thoughts.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [stage, thoughts.length]);

  const stageIcons = {
    reading: Search,
    analyzing: Brain,
    reasoning: Sparkles,
    complete: CheckCircle,
  };

  const stageLabels = {
    reading: "Reading ingredients",
    analyzing: "Analyzing components",
    reasoning: "Reasoning about safety",
    complete: "Analysis complete",
  };

  const StageIcon = stageIcons[stage];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-xl mx-auto"
    >
      <div className="glass-card rounded-2xl p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <motion.div
            animate={{ rotate: stage === "complete" ? 0 : 360 }}
            transition={{ 
              duration: stage === "complete" ? 0 : 2, 
              repeat: stage === "complete" ? 0 : Infinity, 
              ease: "linear" 
            }}
            className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"
          >
            <StageIcon className={`w-5 h-5 ${stage === "complete" ? "text-safe" : "text-primary"}`} />
          </motion.div>
          <div>
            <h3 className="font-display text-lg text-foreground">
              NutriSense is thinking...
            </h3>
            <p className="text-sm text-muted-foreground">{stageLabels[stage]}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative h-2 bg-secondary rounded-full overflow-hidden mb-6">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-safe rounded-full"
            initial={{ width: "0%" }}
            animate={{ 
              width: stage === "reading" ? "33%" : 
                     stage === "analyzing" ? "66%" : 
                     stage === "reasoning" ? "85%" : "100%" 
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        {/* Stage completion indicators */}
        <div className="flex justify-between mb-6">
          {["reading", "analyzing", "reasoning", "complete"].map((s, i) => (
            <div key={s} className="flex flex-col items-center">
              <div className={`
                w-3 h-3 rounded-full transition-colors duration-300
                ${["reading", "analyzing", "reasoning", "complete"].indexOf(stage) >= i 
                  ? "bg-primary" 
                  : "bg-secondary"
                }
              `} />
              <span className="text-[10px] text-muted-foreground mt-1 capitalize hidden sm:block">
                {s === "complete" ? "Done" : s}
              </span>
            </div>
          ))}
        </div>

        {/* Current thought */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentThought}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center"
          >
            <p className="text-sm text-muted-foreground italic">
              "{thoughts[currentThought]}"
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Ingredient flow (during reading stage) */}
        {stage === "reading" && ingredients.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            {ingredients.slice(0, currentIngredient + 1).map((ing, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0.8, x: -20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                className="px-2 py-1 text-xs rounded-full bg-secondary text-foreground/80 font-mono"
              >
                {ing.split("(")[0].trim().slice(0, 20)}
              </motion.span>
            ))}
          </div>
        )}

        {/* Typing indicator (during analyzing/reasoning) */}
        {(stage === "analyzing" || stage === "reasoning") && (
          <div className="flex items-center justify-center gap-1.5 mt-6">
            <div className="typing-dot" style={{ animationDelay: "0ms" }} />
            <div className="typing-dot" style={{ animationDelay: "200ms" }} />
            <div className="typing-dot" style={{ animationDelay: "400ms" }} />
          </div>
        )}
      </div>
    </motion.div>
  );
};
