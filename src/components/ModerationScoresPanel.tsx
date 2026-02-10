import { useState, useCallback } from "react";
import { Icon, type IconName } from "@/components/icons";

type ModerationDecision = "approve" | "review" | "reject";

interface ModerationResponse {
  scores: Record<string, number>;
  decision: ModerationDecision;
  flagged: boolean;
}

interface ModerationScoresPanelProps {
  templateId: string;
  initialScores: Record<string, number> | null;
}

function formatCategoryName(category: string): string {
  return category
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^./, (s) => s.toUpperCase())
    .replace(/\//g, " / ")
    .trim();
}

function formatInitialScores(scores: Record<string, number> | null): string {
  if (!scores) return "No scores yet";
  const highScores = Object.entries(scores)
    .filter(([, value]) => value > 0.1)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([key, value]) => `${formatCategoryName(key)}: ${(value * 100).toFixed(1)}%`);
  return highScores.length > 0 ? highScores.join(", ") : "All scores low";
}

function showToast(type: "success" | "error", message: string) {
  window.dispatchEvent(
    new CustomEvent("moderation-toast", {
      detail: { type, message },
    })
  );
}

const decisionConfig: Record<
  ModerationDecision,
  {
    badgeClass: string;
    iconName: IconName;
    label: string;
  }
> = {
  approve: {
    badgeClass: "bg-green-100 text-green-800 border-green-200",
    iconName: "check-circle",
    label: "Approved",
  },
  review: {
    badgeClass: "bg-yellow-100 text-yellow-800 border-yellow-200",
    iconName: "alert-circle",
    label: "Needs Review",
  },
  reject: {
    badgeClass: "bg-red-100 text-red-800 border-red-200",
    iconName: "x-circle",
    label: "Rejected",
  },
};

const severityStyles = {
  low: {
    pill: "bg-secondary text-muted-foreground border-border",
    bar: "bg-muted",
    value: "text-muted-foreground",
  },
  medium: {
    pill: "bg-amber-100 text-amber-800 border-amber-200",
    bar: "bg-amber-400",
    value: "text-amber-700",
  },
  high: {
    pill: "bg-red-100 text-red-800 border-red-200",
    bar: "bg-red-500",
    value: "text-red-600",
  },
};

function getSeverity(score: number): "low" | "medium" | "high" {
  if (score > 0.5) return "high";
  if (score > 0.1) return "medium";
  return "low";
}

export function ModerationScoresPanel({ templateId, initialScores }: ModerationScoresPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reviewData, setReviewData] = useState<ModerationResponse | null>(null);

  const handleRequestReview = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/admin/moderate/${encodeURIComponent(templateId)}/request`,
        { method: "POST" }
      );

      if (response.ok) {
        const data = (await response.json()) as ModerationResponse;
        setReviewData(data);
        showToast("success", `AI review complete: ${data.decision}`);
      } else {
        const data = (await response.json()) as { error?: string };
        showToast("error", data.error ?? "Failed to request AI review");
      }
    } catch {
      showToast("error", "Failed to request AI review");
    } finally {
      setIsLoading(false);
    }
  }, [templateId]);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const topCategories = reviewData
    ? Object.entries(reviewData.scores)
        .filter(([, v]) => v > 0.05)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
    : [];

  const sortedScores = reviewData
    ? Object.entries(reviewData.scores).sort(([, a], [, b]) => b - a)
    : [];

  return (
    <section
      className="relative bg-secondary/50 border border-border rounded-sm p-4 mb-4 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:bg-accent"
      aria-label="AI Analysis"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary text-primary-foreground flex items-center justify-center rounded-sm">
            <Icon name="clipboard-list" className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-primary/70 uppercase tracking-widest">
            AI Analysis
          </span>
        </div>
        {reviewData && (
          <button
            type="button"
            onClick={toggleExpanded}
            aria-expanded={isExpanded}
            className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-primary bg-secondary border border-border px-3 py-1.5 rounded-sm hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors cursor-pointer"
          >
            <span>{isExpanded ? "Hide breakdown" : "View breakdown"}</span>
            <Icon
              name="chevron-down"
              className={`w-3.5 h-3.5 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
            />
          </button>
        )}
      </div>

      <div className="mt-3 text-sm text-muted-foreground">
        {reviewData ? (
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide border rounded-sm ${decisionConfig[reviewData.decision].badgeClass}`}
            >
              <Icon name={decisionConfig[reviewData.decision].iconName} className="w-3.5 h-3.5" />
              <span>{decisionConfig[reviewData.decision].label}</span>
            </span>
            {reviewData.flagged && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-destructive bg-destructive/10 border border-destructive/20 rounded-sm animate-pulse">
                <Icon name="flag" className="w-3 h-3" />
                Flagged
              </span>
            )}
            <span className="text-muted-foreground">·</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {topCategories.length > 0 ? (
                topCategories.map(([cat, score]) => {
                  const severity = getSeverity(score);
                  return (
                    <span
                      key={cat}
                      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium border rounded-sm ${severityStyles[severity].pill}`}
                    >
                      {formatCategoryName(cat)} {(score * 100).toFixed(0)}%
                    </span>
                  );
                })
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                  <Icon name="check" className="w-3.5 h-3.5" />
                  All categories clear
                </span>
              )}
            </div>
          </div>
        ) : (
          formatInitialScores(initialScores)
        )}
      </div>

      {reviewData && (
        <div
          className={`grid transition-all duration-350 ease-in-out ${
            isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="pt-3 mt-3 border-t border-border">
              <div className="grid grid-cols-[minmax(100px,140px)_1fr_50px] gap-3 pb-2 mb-1 border-b border-dashed border-border">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Category
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Confidence
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground text-right">
                  Score
                </span>
              </div>
              {sortedScores.map(([cat, score], idx) => {
                const pct = (score * 100).toFixed(1);
                const barWidth = Math.min(score * 100, 100);
                const severity = getSeverity(score);
                const delay = idx * 40;

                return (
                  <div
                    key={cat}
                    className="grid grid-cols-[minmax(100px,140px)_1fr_50px] gap-3 items-center py-2 border-b border-border/50 last:border-b-0 animate-fade-slide-in"
                    style={{ animationDelay: `${delay}ms` }}
                  >
                    <span className="text-xs font-medium text-foreground truncate">
                      {formatCategoryName(cat)}
                    </span>
                    <div className="relative h-1.5 bg-secondary border border-border rounded-sm overflow-hidden">
                      <div
                        className={`absolute inset-y-0 left-0 rounded-sm ${severityStyles[severity].bar} animate-grow-bar`}
                        style={
                          {
                            "--bar-width": `${barWidth}%`,
                            animationDelay: `${delay}ms`,
                          } as React.CSSProperties
                        }
                      />
                    </div>
                    <span
                      className={`text-xs font-semibold text-right font-mono ${severityStyles[severity].value}`}
                    >
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {!reviewData && (
        <div className="mt-3">
          <button
            type="button"
            onClick={handleRequestReview}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 h-9 px-3 text-sm font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            data-testid="request-moderation-button"
          >
            {isLoading ? "Requesting..." : "Request AI Review"}
          </button>
        </div>
      )}
    </section>
  );
}
