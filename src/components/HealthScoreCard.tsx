import { motion } from "framer-motion";
import { Heart, AlertTriangle, ShieldCheck, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface HealthScoreCardProps {
  score: number; // 0-100
  verdict: "safe" | "caution" | "concern";
  quickAdvice: string[];
  summary: string;
  onShowDetails: () => void;
}

export const HealthScoreCard = ({
  score,
  verdict,
  quickAdvice,
  summary,
  onShowDetails,
}: HealthScoreCardProps) => {
  const [expanded, setExpanded] = useState(false);

  const getScoreColor = () => {
    if (score >= 70) return "text-safe";
    if (score >= 40) return "text-caution";
    return "text-concern";
  };

  const getScoreGradient = () => {
    if (score >= 70) return "from-safe/20 to-safe/5";
    if (score >= 40) return "from-caution/20 to-caution/5";
    return "from-concern/20 to-concern/5";
  };

  const getScoreBg = () => {
    if (score >= 70) return "bg-safe/10";
    if (score >= 40) return "bg-caution/10";
    return "bg-concern/10";
  };

  const getVerdictIcon = () => {
    switch (verdict) {
      case "safe":
        return <ShieldCheck className="w-6 h-6 text-safe" />;
      case "caution":
        return <AlertTriangle className="w-6 h-6 text-caution" />;
      case "concern":
        return <AlertTriangle className="w-6 h-6 text-concern" />;
    }
  };

  const getVerdictLabel = () => {
    switch (verdict) {
      case "safe":
        return "Generally Safe";
      case "caution":
        return "Use Caution";
      case "concern":
        return "Concerns Found";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card rounded-2xl overflow-hidden bg-gradient-to-br ${getScoreGradient()}`}
    >
      <div className="p-6">
        {/* Score and verdict row */}
        <div className="flex items-center gap-6 mb-6">
          {/* Health Score Circle */}
          <div className="relative">
            <svg className="w-24 h-24 -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-border"
              />
              <motion.circle
                cx="48"
                cy="48"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                className={getScoreColor()}
                initial={{ strokeDasharray: "0 251.2" }}
                animate={{ strokeDasharray: `${(score / 100) * 251.2} 251.2` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <motion.span
                  className={`text-2xl font-bold ${getScoreColor()}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {score}
                </motion.span>
                <p className="text-xs text-muted-foreground">Score</p>
              </div>
            </div>
          </div>

          {/* Verdict */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getVerdictIcon()}
              <span className="font-semibold text-lg text-foreground">{getVerdictLabel()}</span>
            </div>
            <p className="text-muted-foreground text-sm line-clamp-2">{summary}</p>
          </div>
        </div>

        {/* Quick Advice Pills */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Quick Advice
          </h4>
          <div className="flex flex-wrap gap-2">
            {quickAdvice.slice(0, expanded ? undefined : 3).map((advice, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * i }}
                className={`px-3 py-1.5 rounded-full text-sm ${getScoreBg()} text-foreground`}
              >
                {advice}
              </motion.span>
            ))}
          </div>
          {quickAdvice.length > 3 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-2 text-sm text-primary flex items-center gap-1 hover:underline"
            >
              {expanded ? (
                <>
                  Show less <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  +{quickAdvice.length - 3} more <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>

        {/* View Full Analysis Button */}
        <Button
          onClick={onShowDetails}
          variant="outline"
          className="w-full gap-2"
        >
          <Heart className="w-4 h-4" />
          View Full Analysis
        </Button>
      </div>
    </motion.div>
  );
};
