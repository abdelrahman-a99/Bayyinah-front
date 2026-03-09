import { useState } from "react";
import { ChevronDown, ChevronUp, ShieldCheck, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CitationItem {
  uid?: string;
  display?: string;
  short?: string;
  url?: string | null;
  tier?: number;
  is_narrative?: boolean;
}

interface CitationCardProps {
  citations: CitationItem[];
  usedSources: string[];
  confidenceScore: number;
  tierBreakdown: Record<string, number>;
}

export function CitationCard({
  citations,
  usedSources,
  confidenceScore,
  tierBreakdown,
}: CitationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getTierLabel = (tier?: number) => {
    if (tier === 1) return "📖 القرآن الكريم / التفسير";
    if (tier === 2) return "📜 الحديث الشريف";
    if (tier === 3) return "📚 المصادر السردية";
    return "📚 مصدر";
  };

  if (!citations?.length && !usedSources?.length) return null;

  return (
    <div className="mt-4 border border-border/50 rounded-lg overflow-hidden bg-muted/20 text-sm">
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/40 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span className="font-kufi font-medium">المصادر المعتمدة ({citations?.length || usedSources?.length || 0})</span>
        </div>

        <div className="flex items-center gap-3">
          {confidenceScore > 0 && (
            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-bold font-kufi">
              موثوقية {Math.round(confidenceScore * 100)}%
            </span>
          )}
          <Button variant="ghost" size="icon" className="h-6 w-6">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 border-t border-border/50 space-y-4">
          {/* Tiers summary */}
          {Object.keys(tierBreakdown || {}).length > 0 && (
            <div className="flex gap-2 flex-wrap mb-3">
              {Object.entries(tierBreakdown).map(([tier, count]) => {
                const label =
                  tier === "tier_1"
                    ? "القرآن الكريم / التفسير"
                    : tier === "tier_2"
                      ? "الحديث الشريف"
                      : tier === "tier_3"
                        ? "المصادر السردية"
                        : tier;

                return (
                  <span key={tier} className="bg-background border border-border text-muted-foreground px-2 py-1 rounded text-xs">
                    {label}: {count}
                  </span>
                );
              })}
            </div>
          )}

          {/* Citations List */}
          {citations?.length > 0 ? (
            <div className="space-y-3">
              {citations.map((cite, idx) => (
                <div key={`${cite.uid || "citation"}-${idx}`} className="bg-background rounded p-3 border border-border shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold font-kufi text-primary">
                      {getTierLabel(cite.tier)}
                    </span>

                    {cite.uid && (
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        {cite.uid}
                      </span>
                    )}
                  </div>

                  {cite.display && (
                    <p className="font-naskh text-foreground/90 leading-relaxed text-sm my-2">
                      {cite.display}
                    </p>
                  )}

                  {cite.short && (
                    <p className="text-xs leading-relaxed text-muted-foreground font-naskh">
                      {cite.short}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-2">
                    {typeof cite.is_narrative === "boolean" && (
                      <span>{cite.is_narrative ? "مصدر سردي" : "مصدر موثّق"}</span>
                    )}

                    {cite.url && (
                      <a
                        href={cite.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        فتح المصدر
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : usedSources?.length > 0 ? (
            <ul className="list-disc leading-loose pl-0 pr-4 list-inside space-y-1 text-muted-foreground">
              {usedSources.map((source, idx) => (
                <li key={idx} className="font-naskh">{source}</li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </div>
  );
}
