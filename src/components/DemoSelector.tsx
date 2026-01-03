import { motion } from "framer-motion";
import { demoScenarios } from "@/data/demoData";

interface DemoSelectorProps {
  onSelectDemo: (demo: typeof demoScenarios[0]) => void;
}

export const DemoSelector = ({ onSelectDemo }: DemoSelectorProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="w-full max-w-3xl mx-auto mt-12"
    >
      <div className="text-center mb-6">
        <span className="text-sm text-muted-foreground uppercase tracking-wider font-medium">
          Try a demo
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {demoScenarios.map((demo, i) => (
          <motion.button
            key={demo.name}
            onClick={() => onSelectDemo(demo)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 + i * 0.1 }}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group glass-card rounded-2xl p-5 text-left hover:shadow-elevated transition-all duration-300"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg group-hover:bg-primary/20 transition-colors">
                {demo.name === "Doritos Nacho Cheese" && "🌽"}
                {demo.name === "Protein Bar" && "💪"}
                {demo.name === "Baby Food" && "👶"}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                  {demo.name}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {demo.description}
                </p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground/70 line-clamp-2 font-mono">
              {demo.input.slice(0, 80)}...
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};
