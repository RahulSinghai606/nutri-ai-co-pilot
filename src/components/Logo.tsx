import { motion } from "framer-motion";
import { Leaf } from "lucide-react";

export const Logo = () => {
  return (
    <motion.div 
      className="flex items-center gap-2"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-soft">
          <Leaf className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-safe border-2 border-background" />
      </div>
      <div className="flex flex-col">
        <span className="font-display text-xl font-semibold text-foreground leading-tight">
          NutriSense
        </span>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium -mt-0.5">
          AI
        </span>
      </div>
    </motion.div>
  );
};
