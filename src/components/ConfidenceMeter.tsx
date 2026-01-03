import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface ConfidenceMeterProps {
  value: number;
  verdict: "safe" | "caution" | "concern";
  size?: number;
}

export const ConfidenceMeter = ({ value, verdict, size = 100 }: ConfidenceMeterProps) => {
  const [displayValue, setDisplayValue] = useState(0);
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayValue / 100) * circumference;

  const colorConfig = {
    safe: { stroke: "hsl(var(--safe))", bg: "hsl(var(--safe) / 0.15)" },
    caution: { stroke: "hsl(var(--accent))", bg: "hsl(var(--accent) / 0.15)" },
    concern: { stroke: "hsl(var(--caution))", bg: "hsl(var(--caution) / 0.15)" },
  };

  const colors = colorConfig[verdict];

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.round(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colors.bg}
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        
        {/* Center value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-2xl font-display font-bold text-foreground"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
          >
            {displayValue}%
          </motion.span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground font-medium">
        Confidence
      </span>
    </div>
  );
};
