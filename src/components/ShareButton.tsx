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

export const ShareButton = ({ analysis }: ShareButtonProps) => {
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (shareUrl) {
      // Already have a share URL, just copy it
      copyToClipboard(shareUrl);
      return;
    }

    setIsSharing(true);

    try {
      const insertData = {
        product_name: analysis.productName || null,
        verdict: analysis.verdict,
        verdict_explanation: analysis.summary,
        health_score: analysis.healthScore || null,
        quick_advice: JSON.stringify(analysis.quickAdvice),
        confidence: analysis.confidence,
        ingredients: JSON.stringify(analysis.categories),
        tradeoffs: JSON.stringify(analysis.tradeoffs),
      };

      const { data, error } = await supabase
        .from("shared_analyses")
        .insert(insertData)
        .select("share_code")
        .single();

      if (error) throw error;

      const url = `${window.location.origin}/share/${data.share_code}`;
      setShareUrl(url);
      copyToClipboard(url);
      toast.success("Share link created and copied!");
    } catch (err) {
      console.error("Failed to create share link:", err);
      toast.error("Failed to create share link. Please try again.");
    } finally {
      setIsSharing(false);
    }
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
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
