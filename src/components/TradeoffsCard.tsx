import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Tradeoff } from "@/types/analysis";

interface TradeoffsCardProps {
  tradeoffs: Tradeoff[];
}

export const TradeoffsCard = ({ tradeoffs }: TradeoffsCardProps) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  if (tradeoffs.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="w-full"
    >
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-display text-xl text-foreground mb-2 flex items-center gap-2">
          <span>⚖️</span>
          Understanding the Tradeoffs
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Let me explain why these ingredients exist and what to actually think about them.
        </p>

        <div className="space-y-4">
          {tradeoffs.map((tradeoff, index) => (
            <motion.div
              key={tradeoff.ingredient}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="border border-border/50 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">🧂</span>
                  <span className="font-medium text-foreground text-left">
                    {tradeoff.ingredient}
                  </span>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-muted-foreground transition-transform ${
                    expandedIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {expandedIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-4">
                      {/* Why it's here */}
                      <div className="p-4 bg-safe/10 rounded-lg border border-safe/20">
                        <h4 className="text-sm font-semibold text-safe uppercase tracking-wide mb-2">
                          Why It's Here
                        </h4>
                        <p className="text-sm text-foreground/80 leading-relaxed">
                          {tradeoff.why}
                        </p>
                      </div>

                      {/* The concern */}
                      <div className="p-4 bg-caution/10 rounded-lg border border-caution/20">
                        <h4 className="text-sm font-semibold text-caution uppercase tracking-wide mb-2">
                          The Concern
                        </h4>
                        <p className="text-sm text-foreground/80 leading-relaxed">
                          {tradeoff.concern}
                        </p>
                      </div>

                      {/* The reality */}
                      <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                        <h4 className="text-sm font-semibold text-primary uppercase tracking-wide mb-2">
                          The Reality
                        </h4>
                        <p className="text-sm text-foreground/80 leading-relaxed">
                          {tradeoff.reality}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
