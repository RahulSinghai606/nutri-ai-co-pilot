import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Type, Mic, Upload, Sparkles, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";

interface InputBoxProps {
  onAnalyze: (input: { text?: string; imageBase64?: string }) => void;
  isProcessing?: boolean;
}

export const InputBox = ({ onAnalyze, isProcessing = false }: InputBoxProps) => {
  const [text, setText] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<{ file: File; preview: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { isRecording, isTranscribing, toggleRecording } = useVoiceRecording((transcribedText) => {
    setText((prev) => prev ? `${prev} ${transcribedText}` : transcribedText);
  });

  const handleAnalyze = useCallback(async () => {
    if ((!text.trim() && !uploadedImage) || isProcessing) return;

    let imageBase64: string | undefined;
    
    if (uploadedImage) {
      imageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(uploadedImage.file);
      });
    }

    onAnalyze({
      text: text.trim() || undefined,
      imageBase64,
    });
  }, [text, uploadedImage, isProcessing, onAnalyze]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAnalyze();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const preview = URL.createObjectURL(file);
      setUploadedImage({ file, preview });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      setUploadedImage({ file, preview });
    }
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const removeImage = () => {
    if (uploadedImage) {
      URL.revokeObjectURL(uploadedImage.preview);
      setUploadedImage(null);
    }
  };

  const canAnalyze = text.trim() || uploadedImage;

  const examplePrompts = [
    "Tell me about these ingredients",
    "Is this healthy for kids?",
    "What are the concerns?",
  ];

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        className={`
          relative rounded-2xl border-2 transition-all duration-300
          ${isDragOver ? "border-primary border-dashed scale-[1.02] bg-primary/5" : ""}
          ${isFocused ? "border-primary/50 shadow-elevated" : "border-border shadow-card"}
          ${isProcessing ? "opacity-60 pointer-events-none" : ""}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {/* Glow effect */}
        <div className={`
          absolute inset-0 rounded-2xl transition-opacity duration-300 pointer-events-none
          ${isFocused ? "opacity-100" : "opacity-0"}
        `} style={{
          background: "linear-gradient(135deg, hsl(var(--primary) / 0.05), hsl(var(--safe) / 0.05))",
          filter: "blur(20px)",
          transform: "scale(1.05)",
        }} />

        <div className="relative glass-card rounded-2xl p-4 md:p-6">
          {/* Uploaded image preview */}
          <AnimatePresence>
            {uploadedImage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 relative"
              >
                <div className="relative inline-block">
                  <img
                    src={uploadedImage.preview}
                    alt="Uploaded product"
                    className="max-h-48 rounded-xl object-contain border border-border"
                  />
                  <button
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-concern text-white rounded-full flex items-center justify-center hover:bg-concern/80 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Image uploaded! Add a question or click Analyze.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input mode icons */}
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="ghost"
              size="sm"
              className={`h-9 px-3 gap-2 transition-colors ${
                uploadedImage 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-primary hover:bg-primary/10"
              }`}
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">Photo</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-3 gap-2 text-primary bg-primary/10"
            >
              <Type className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">Text</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`h-9 px-3 gap-2 transition-colors ${
                isRecording 
                  ? "text-caution bg-caution/10 animate-pulse" 
                  : isTranscribing
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/10"
              }`}
              onClick={toggleRecording}
              disabled={isProcessing || isTranscribing}
            >
              {isTranscribing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Mic className={`w-4 h-4 ${isRecording ? "animate-pulse" : ""}`} />
              )}
              <span className="hidden sm:inline text-sm">
                {isRecording ? "Recording..." : isTranscribing ? "Processing..." : "Voice"}
              </span>
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {/* Main textarea */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
              placeholder={uploadedImage 
                ? "Ask about these ingredients... (e.g., 'Is this safe for kids?', 'What are the concerns?')" 
                : "Paste ingredients, describe what you're looking at, or drop an image..."
              }
              className="w-full min-h-[100px] bg-transparent border-none outline-none resize-none text-foreground placeholder:text-muted-foreground text-base md:text-lg leading-relaxed"
              disabled={isProcessing}
            />

            {/* Drag overlay */}
            <AnimatePresence>
              {isDragOver && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-xl border-2 border-dashed border-primary"
                >
                  <div className="flex items-center gap-2 text-primary font-medium">
                    <Upload className="w-5 h-5" />
                    Drop to upload
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="hidden sm:inline">Press Enter to analyze</span>
              {text.length > 0 && (
                <span className="text-muted-foreground/60">
                  {text.length} characters
                </span>
              )}
            </div>
            <Button
              onClick={handleAnalyze}
              disabled={!canAnalyze || isProcessing}
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-soft"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Analyze
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Example prompts */}
      <motion.div 
        className="flex flex-wrap items-center justify-center gap-2 mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <span className="text-sm text-muted-foreground">Try:</span>
        {examplePrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => setText(prompt)}
            className="px-3 py-1.5 text-sm rounded-full bg-secondary/50 hover:bg-secondary text-foreground/80 hover:text-foreground transition-colors"
          >
            {prompt}
          </button>
        ))}
      </motion.div>
    </div>
  );
};
