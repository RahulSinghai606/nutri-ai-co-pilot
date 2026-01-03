import { motion } from "framer-motion";
import { CheckCircle, AlertCircle, AlertTriangle, Sparkles } from "lucide-react";
import { ConfidenceMeter } from "./ConfidenceMeter";

interface VerdictCardProps {
  verdict: "safe" | "caution" | "concern";
  confidence: number;
  summary: string;
  contextNote?: string;
  detectedContext?: string;
  onContextChange?: () => void;
}

export const VerdictCard = ({
  verdict,
  confidence,
  summary,
  contextNote,
  detectedContext,
  onContextChange,
}: VerdictCardProps) => {
  const verdictConfig = {
    safe: {
      icon: CheckCircle,
      label: "Generally Safe",
      sublabel: "for most people",
      bgClass: "bg-safe/10",
      borderClass: "border-safe/30",
      iconClass: "text-safe",
      gradientFrom: "from-safe/20",
    },
    caution: {
      icon: AlertCircle,
      label: "Some Concerns",
      sublabel: "worth knowing about",
      bgClass: "bg-accent/10",
      borderClass: "border-accent/30",
      iconClass: "text-accent",
      gradientFrom: "from-accent/20",
    },
    concern: {
      icon: AlertTriangle,
      label: "Worth Investigating",
      sublabel: "review recommended",
      bgClass: "bg-caution/10",
      borderClass: "border-caution/30",
      iconClass: "text-caution",
      gradientFrom: "from-caution/20",
    },
  };

  const config = verdictConfig[verdict];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <div className={`
        glass-card rounded-2xl overflow-hidden
        border ${config.borderClass}
      `}>
        {/* Gradient header */}
        <div className={`
          p-6 md:p-8
          bg-gradient-to-br ${config.gradientFrom} to-transparent
        `}>
          {/* Verdict badge */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className={`
              inline-flex items-center gap-3 px-4 py-2 rounded-xl
              ${config.bgClass} border ${config.borderClass}
            `}
          >
            <Icon className={`w-6 h-6 ${config.iconClass}`} />
            <div>
              <div className={`font-display text-xl ${config.iconClass}`}>
                {config.label}
              </div>
              <div className="text-sm text-muted-foreground">
                {config.sublabel}
              </div>
            </div>
          </motion.div>

          {/* Confidence and summary row */}
          <div className="flex flex-col md:flex-row gap-6 mt-6">
            {/* Confidence meter */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex-shrink-0"
            >
              <ConfidenceMeter value={confidence} verdict={verdict} />
            </motion.div>

            {/* Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex-1"
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">
                  The short version:
                </span>
              </div>
              <p className="text-foreground leading-relaxed">
                {summary}
              </p>
            </motion.div>
          </div>
        </div>

        {/* Context note */}
        {(contextNote || detectedContext) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="px-6 md:px-8 py-4 bg-secondary/30 border-t border-border/50"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-2">
                <span className="text-lg">🔍</span>
                <div>
                  <span className="text-sm text-muted-foreground">
                    Context:{" "}
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {detectedContext}
                  </span>
                  {contextNote && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {contextNote}
                    </p>
                  )}
                </div>
              </div>
              {onContextChange && (
                <button
                  onClick={onContextChange}
                  className="text-sm text-primary hover:text-primary/80 underline-offset-2 hover:underline flex-shrink-0"
                >
                  Change context
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
