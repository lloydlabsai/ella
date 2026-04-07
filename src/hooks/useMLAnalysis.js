import { useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { runMLPipeline } from "../utils/pipeline";

export function useMLAnalysis(userId) {
  const [results, setResults] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const analyze = useCallback(
    async (posts) => {
      if (!posts.length || posts.length < 5) {
        throw new Error("Need at least 5 posts for ML analysis");
      }
      setAnalyzing(true);
      try {
        // Run client-side ML pipeline
        const mlResults = runMLPipeline(posts);
        setResults(mlResults);

        // Cache results in Supabase
        if (userId) {
          await supabase.from("ml_results").insert({
            user_id: userId,
            results_json: mlResults,
            post_count: posts.length,
          });
        }
        return mlResults;
      } finally {
        setAnalyzing(false);
      }
    },
    [userId]
  );

  const loadCached = useCallback(async () => {
    if (!userId) return null;
    const { data } = await supabase
      .from("ml_results")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (data) {
      setResults(data.results_json);
      return data.results_json;
    }
    return null;
  }, [userId]);

  return { results, analyzing, analyze, loadCached };
}
