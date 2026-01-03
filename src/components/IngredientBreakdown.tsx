import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Info } from "lucide-react";
import { IngredientCategory, Ingredient } from "@/types/analysis";

interface IngredientBreakdownProps {
  categories: IngredientCategory[];
  onIngredientSelect?: (ingredient: Ingredient) => void;
}

const SafetyDot = ({ safety }: { safety: Ingredient["safety"] }) => {
  const dotClass = {
    safe: "safety-dot-safe",
    moderate: "safety-dot-caution",
    concern: "safety-dot-concern",
    unknown: "safety-dot-unknown",
  };

  return <div className={`safety-dot ${dotClass[safety]}`} />;
};

export const IngredientBreakdown = ({ categories, onIngredientSelect }: IngredientBreakdownProps) => {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    categories.slice(0, 2).map((c) => c.name)
  );
  const [expandedIngredients, setExpandedIngredients] = useState<string[]>([]);

  const toggleCategory = (name: string) => {
    setExpandedCategories((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const toggleIngredient = (name: string) => {
    setExpandedIngredients((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full"
    >
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-display text-xl text-foreground mb-6 flex items-center gap-2">
          <span>🔬</span>
          What's Actually In This
        </h3>

        <div className="space-y-4">
          {categories.map((category, catIndex) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: catIndex * 0.1 }}
              className="border border-border/50 rounded-xl overflow-hidden"
            >
              {/* Category header */}
              <button
                onClick={() => toggleCategory(category.name)}
                className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{category.icon}</span>
                  <span className="font-medium text-foreground uppercase text-sm tracking-wide">
                    {category.name}
                  </span>
                  <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                    {category.ingredients.length}
                  </span>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-muted-foreground transition-transform ${
                    expandedCategories.includes(category.name) ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* AI Note */}
              {category.aiNote && expandedCategories.includes(category.name) && (
                <div className="px-4 pb-3">
                  <div className="flex items-start gap-2 p-3 bg-accent/10 rounded-lg border border-accent/20">
                    <Info className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground/80">{category.aiNote}</p>
                  </div>
                </div>
              )}

              {/* Ingredients list */}
              <AnimatePresence>
                {expandedCategories.includes(category.name) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-2">
                      {category.ingredients.map((ingredient, ingIndex) => (
                        <motion.div
                          key={ingredient.commonName}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: ingIndex * 0.05 }}
                          className="bg-secondary/30 rounded-lg overflow-hidden"
                        >
                          <button
                            onClick={() => {
                              toggleIngredient(ingredient.commonName);
                              onIngredientSelect?.(ingredient);
                            }}
                            className="w-full p-3 text-left hover:bg-secondary/50 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <SafetyDot safety={ingredient.safety} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2 flex-wrap">
                                  <span className="font-medium text-foreground">
                                    {ingredient.commonName}
                                  </span>
                                  {ingredient.scientificName && (
                                    <span className="text-xs text-muted-foreground font-mono">
                                      ({ingredient.scientificName})
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {ingredient.explanation}
                                </p>
                              </div>
                              {ingredient.detailedInfo && (
                                <ChevronDown
                                  className={`w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 ${
                                    expandedIngredients.includes(ingredient.commonName)
                                      ? "rotate-180"
                                      : ""
                                  }`}
                                />
                              )}
                            </div>
                          </button>

                          {/* Detailed info */}
                          <AnimatePresence>
                            {ingredient.detailedInfo &&
                              expandedIngredients.includes(ingredient.commonName) && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-3 pb-3 pl-8">
                                    <div className="p-3 bg-background/50 rounded-lg border border-border/30">
                                      <p className="text-sm text-foreground/80 leading-relaxed">
                                        {ingredient.detailedInfo}
                                      </p>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                          </AnimatePresence>
                        </motion.div>
                      ))}
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
