import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Copy, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { AnalysisResult } from "@/types/analysis";
import { toast } from "sonner";

interface ShareButtonProps {
  analysis: AnalysisResult;
}

// Check if Web Share API is available (better mobile support)
const canUseWebShare = () => {
  return typeof navigator !== "undefined" && 
         typeof navigator.share === "function" &&
         navigator.canShare?.({ url: window.location.href, title: "Test" });
};

// Fallback clipboard copy that works on more browsers
const copyToClipboardFallback = (text: string): boolean => {
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
};

export const ShareButton = ({ analysis }: ShareButtonProps) => {
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (url: string): Promise<boolean> => {
    // Try modern clipboard API first
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        return true;
      } catch {
        // Fall through to fallback
      }
    }
    
    // Fallback for older browsers and some mobile browsers
    return copyToClipboardFallback(url);
  };

  const handleShare = async () => {
    if (shareUrl) {
      // Already have a share URL, use Web Share API on mobile or copy
      if (canUseWebShare()) {
        try {
          await navigator.share({
            title: analysis.productName || "NutriSense Analysis",
            text: `Check out this ingredient analysis: ${analysis.summary?.slice(0, 100)}...`,
            url: shareUrl,
          });
          toast.success("Shared successfully!");
          return;
        } catch (err) {
          // User cancelled or share failed, fall through to copy
          if ((err as Error).name !== "AbortError") {
            console.log("Share failed, falling back to copy");
          }
        }
      }
      
      // Fallback to clipboard copy
      const success = await copyToClipboard(shareUrl);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Link copied to clipboard!");
      } else {
        // Show the URL in a toast so user can manually copy
        toast.info(`Share link: ${shareUrl}`, { duration: 10000 });
      }
      return;
    }

    setIsSharing(true);

    try {
      const insertData = {
        product_name: analysis.productName || null,
        verdict: analysis.verdict,
        verdict_explanation: analysis.summary,
        health_score: analysis.healthScore || null,
        quick_advice: JSON.stringify(analysis.quickAdvice || []),
        confidence: analysis.confidence,
        ingredients: JSON.stringify(analysis.categories || []),
        tradeoffs: JSON.stringify(analysis.tradeoffs || []),
      };

      const { data, error } = await supabase
        .from("shared_analyses")
        .insert(insertData)
        .select("share_code")
        .single();

      if (error) {
        console.error("Supabase error:", error);
        throw new Error(error.message || "Failed to save analysis");
      }

      if (!data?.share_code) {
        throw new Error("No share code returned");
      }

      const url = `${window.location.origin}/share/${data.share_code}`;
      setShareUrl(url);
      
      // Try Web Share API first on mobile
      if (canUseWebShare()) {
        try {
          await navigator.share({
            title: analysis.productName || "NutriSense Analysis",
            text: `Check out this ingredient analysis: ${analysis.summary?.slice(0, 100)}...`,
            url: url,
          });
          toast.success("Shared successfully!");
          return;
        } catch (err) {
          if ((err as Error).name !== "AbortError") {
            console.log("Share failed, falling back to copy");
          }
        }
      }
      
      // Fallback to clipboard
      const success = await copyToClipboard(url);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Share link created and copied!");
      } else {
        toast.success("Share link created!");
        toast.info(`Link: ${url}`, { duration: 10000 });
      }
    } catch (err) {
      console.error("Failed to create share link:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Failed to create share link: ${errorMessage}`);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleShare}
        disabled={isSharing}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <AnimatePresence mode="wait">
          {isSharing ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Loader2 className="w-4 h-4 animate-spin" />
            </motion.div>
          ) : copied ? (
            <motion.div
              key="copied"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Check className="w-4 h-4 text-safe" />
            </motion.div>
          ) : shareUrl ? (
            <motion.div
              key="copy"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Copy className="w-4 h-4" />
            </motion.div>
          ) : (
            <motion.div
              key="share"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Share2 className="w-4 h-4" />
            </motion.div>
          )}
        </AnimatePresence>
        {copied ? "Copied!" : shareUrl ? "Copy Link" : "Share"}
      </Button>
    </div>
  );
};