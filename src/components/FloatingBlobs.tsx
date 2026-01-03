import { motion } from "framer-motion";

interface FloatingBlobsProps {
  className?: string;
}

export const FloatingBlobs = ({ className = "" }: FloatingBlobsProps) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Primary blob - top right */}
      <motion.div
        className="blob blob-primary w-96 h-96 -top-48 -right-48"
        animate={{
          y: [0, -30, 10, 0],
          x: [0, 20, -10, 0],
          rotate: [0, 5, -3, 0],
          scale: [1, 1.05, 0.98, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Safe blob - bottom left */}
      <motion.div
        className="blob blob-safe w-72 h-72 -bottom-36 -left-36"
        animate={{
          y: [0, 20, -15, 0],
          x: [0, -15, 10, 0],
          rotate: [0, -4, 6, 0],
          scale: [1, 0.95, 1.03, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />
      
      {/* Accent blob - center right */}
      <motion.div
        className="blob blob-accent w-64 h-64 top-1/3 -right-32 opacity-20"
        animate={{
          y: [0, -25, 15, 0],
          x: [0, 10, -20, 0],
          rotate: [0, 8, -5, 0],
          scale: [1, 1.08, 0.96, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 5,
        }}
      />
      
      {/* Small primary blob - top left */}
      <motion.div
        className="blob blob-primary w-48 h-48 top-20 left-1/4 opacity-15"
        animate={{
          y: [0, 15, -20, 0],
          x: [0, -10, 15, 0],
          rotate: [0, -6, 4, 0],
          scale: [1, 0.92, 1.06, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 8,
        }}
      />
    </div>
  );
};
