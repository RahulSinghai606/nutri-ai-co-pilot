import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Header, Footer } from "@/components/Layout";
import { FloatingBlobs } from "@/components/FloatingBlobs";
import { HealthScoreCard } from "@/components/HealthScoreCard";
import { VerdictCard } from "@/components/VerdictCard";
import { IngredientBreakdown } from "@/components/IngredientBreakdown";
import { TradeoffsCard } from "@/components/TradeoffsCard";
import { Button } from "@/components/ui/button";
import { AnalysisResult, IngredientCategory, Tradeoff } from "@/types/analysis";

export default function SharedAnalysis() {
  const { shareCode } = useParams<{ shareCode: string }>();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullAnalysis, setShowFullAnalysis] = useState(false);

  useEffect(() => {
    async function fetchAnalysis() {
      if (!shareCode) {
        setError("Invalid share link");
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("shared_analyses")
        .select("*")
        .eq("share_code", shareCode)
        .single();

      if (fetchError || !data) {
        setError("Analysis not found or link has expired");
        setLoading(false);
        return;
      }

      // Parse JSON fields that were stringified on insert
      let quickAdvice: string[] = [];
      let categories: IngredientCategory[] = [];
      let tradeoffs: Tradeoff[] = [];

      try {
        // Handle quick_advice - could be a string (JSON) or already an array
        if (typeof data.quick_advice === "string") {
          quickAdvice = JSON.parse(data.quick_advice);
        } else if (Array.isArray(data.quick_advice)) {
          quickAdvice = data.quick_advice as string[];
        }
      } catch (e) {
        console.error("Failed to parse quick_advice:", e);
      }

      try {
        // Handle ingredients - could be a string (JSON) or already an array
        if (typeof data.ingredients === "string") {
          categories = JSON.parse(data.ingredients);
        } else if (Array.isArray(data.ingredients)) {
          categories = data.ingredients as unknown as IngredientCategory[];
        } else if (data.ingredients && typeof data.ingredients === "object") {
          categories = data.ingredients as unknown as IngredientCategory[];
        }
      } catch (e) {
        console.error("Failed to parse ingredients:", e);
      }

      try {
        // Handle tradeoffs - could be a string (JSON) or already an array
        if (typeof data.tradeoffs === "string") {
          tradeoffs = JSON.parse(data.tradeoffs);
        } else if (Array.isArray(data.tradeoffs)) {
          tradeoffs = data.tradeoffs as unknown as Tradeoff[];
        } else if (data.tradeoffs && typeof data.tradeoffs === "object") {
          tradeoffs = data.tradeoffs as unknown as Tradeoff[];
        }
      } catch (e) {
        console.error("Failed to parse tradeoffs:", e);
      }

      // Transform database row to AnalysisResult
      setAnalysis({
        id: data.id,
        productName: data.product_name || undefined,
        verdict: data.verdict as AnalysisResult["verdict"],
        summary: data.verdict_explanation || "",
        healthScore: data.health_score || 50,
        quickAdvice,
        confidence: data.confidence || 75,
        categories,
        tradeoffs,
        contextNote: "",
      });
      setLoading(false);
    }

    fetchAnalysis();
  }, [shareCode]);

  if (loading) {
    return (
      <div className="min-h-screen relative">
        <FloatingBlobs />
        <Header />
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading shared analysis...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen relative">
        <FloatingBlobs />
        <Header />
        <div className="min-h-[60vh] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <div className="text-6xl">🔍</div>
            <h2 className="text-xl font-display font-semibold text-foreground">
              {error || "Analysis not found"}
            </h2>
            <p className="text-muted-foreground">
              This link may be invalid or the analysis has been removed.
            </p>
            <Link to="/">
              <Button className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Analyze Your Own Product
              </Button>
            </Link>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <FloatingBlobs />
      <Header />
      
      <main className="relative z-10 pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <p className="text-sm text-muted-foreground">Shared Analysis</p>
              {analysis.productName && (
                <h1 className="text-2xl font-display font-semibold text-foreground">
                  {analysis.productName}
                </h1>
              )}
            </div>
            <Link to="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Try NutriSense
              </Button>
            </Link>
          </motion.div>

          {/* Quick Overview */}
          {!showFullAnalysis && (
            <HealthScoreCard
              score={analysis.healthScore}
              verdict={analysis.verdict}
              quickAdvice={analysis.quickAdvice}
              summary={analysis.summary}
              onShowDetails={() => setShowFullAnalysis(true)}
            />
          )}

          {/* Full Analysis */}
          {showFullAnalysis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <VerdictCard
                verdict={analysis.verdict}
                confidence={analysis.confidence}
                summary={analysis.summary}
                contextNote={analysis.contextNote}
                detectedContext={analysis.detectedContext}
              />

              <IngredientBreakdown categories={analysis.categories} />

              {analysis.tradeoffs.length > 0 && (
                <TradeoffsCard tradeoffs={analysis.tradeoffs} />
              )}

              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  onClick={() => setShowFullAnalysis(false)}
                  className="gap-2 text-muted-foreground"
                >
                  Show Quick View
                </Button>
              </div>
            </motion.div>
          )}

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center py-8"
          >
            <p className="text-muted-foreground mb-4">
              Want to analyze your own food products?
            </p>
            <Link to="/">
              <Button size="lg">Try NutriSense AI Free</Button>
            </Link>
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
