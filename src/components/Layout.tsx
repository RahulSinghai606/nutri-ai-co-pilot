import { motion } from "framer-motion";
import { Logo } from "./Logo";
import { Sparkles, Shield, Brain } from "lucide-react";

export const Header = () => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="glass-card mt-4 rounded-2xl px-4 py-3">
          <div className="flex items-center justify-between">
            <Logo />
            
            <nav className="hidden md:flex items-center gap-6">
              <a 
                href="#how-it-works" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                How it Works
              </a>
              <a 
                href="#about" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                About
              </a>
            </nav>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="w-3.5 h-3.5" />
                <span>Private & Secure</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export const HowItWorks = () => {
  const steps = [
    {
      icon: Sparkles,
      title: "Input Ingredients",
      description: "Paste a list, take a photo, or just describe what you're looking at. We understand it all.",
    },
    {
      icon: Brain,
      title: "AI Reasoning",
      description: "Our AI doesn't just look up data—it reasons about ingredients, considering context and trade-offs.",
    },
    {
      icon: Shield,
      title: "Clear Insights",
      description: "Get honest assessments with uncertainty clearly communicated. No fear-mongering, just facts.",
    },
  ];

  return (
    <section id="how-it-works" className="py-20">
      <div className="max-w-5xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl text-foreground mb-4">
            How NutriSense Thinks
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We don't just look up ingredients in a database. Our AI reasons about what you're eating, 
            considering scientific evidence and real-world context.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card rounded-2xl p-6 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <step.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-display text-xl text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export const Footer = () => {
  return (
    <footer className="py-12 border-t border-border">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo />
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span>Built for AI-Native Hackathon</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">Powered by AI Reasoning</span>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-border/50 text-center text-xs text-muted-foreground">
          <p>
            ⚠️ This tool provides information, not medical advice. Always consult healthcare professionals for dietary concerns.
          </p>
        </div>
      </div>
    </footer>
  );
};
