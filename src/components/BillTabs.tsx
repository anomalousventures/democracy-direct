import { useState, useEffect, useCallback, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BillVotes } from "./BillVotes";
import { BillAmendments } from "./BillAmendments";
import { BillSummary } from "./BillSummary";
import { cn } from "@/lib/utils";
import type { BillWithSponsor } from "@/db/queries/bills";

export interface BillTabsProps {
  billId: string;
  bill: BillWithSponsor;
  voteCount: number;
  amendmentCount: number;
  className?: string;
}

type TabValue = "summary" | "votes" | "amendments";

const TAB_HASH_MAP: Record<string, TabValue> = {
  "#summary": "summary",
  "#votes": "votes",
  "#amendments": "amendments",
};

const VALUE_HASH_MAP: Record<TabValue, string> = {
  summary: "",
  votes: "#votes",
  amendments: "#amendments",
};

function getInitialTab(): TabValue {
  if (typeof window === "undefined") return "summary";
  const hash = window.location.hash;
  return TAB_HASH_MAP[hash] || "summary";
}

export function BillTabs({ billId, bill, voteCount, amendmentCount, className }: BillTabsProps) {
  const [activeTab, setActiveTab] = useState<TabValue>("summary");

  useEffect(() => {
    setActiveTab(getInitialTab());

    const handleHashChange = () => {
      setActiveTab(getInitialTab());
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const handleTabChange = useCallback((value: string) => {
    const tabValue = value as TabValue;
    setActiveTab(tabValue);
    const hash = VALUE_HASH_MAP[tabValue];
    if (hash) {
      window.history.replaceState(null, "", hash);
    } else {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);

  const tabTriggerClass = useMemo(
    () =>
      cn(
        "relative px-4 py-3 text-sm font-medium transition-colors rounded-none",
        "text-muted-foreground hover:text-foreground",
        "data-[state=active]:text-primary data-[state=active]:font-semibold",
        "data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-accent"
      ),
    []
  );

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className={cn("w-full", className)}>
      <div className="border-b border-border">
        <TabsList className="w-full justify-start h-auto p-0 bg-transparent rounded-none">
          <TabsTrigger value="summary" className={tabTriggerClass}>
            Summary
          </TabsTrigger>
          <TabsTrigger value="votes" className={tabTriggerClass}>
            Votes
            {voteCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-secondary text-muted-foreground rounded-full">
                {voteCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="amendments" className={tabTriggerClass}>
            Amendments
            {amendmentCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-secondary text-muted-foreground rounded-full">
                {amendmentCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="summary" className="mt-0 pt-6">
        <BillSummary bill={bill} />
      </TabsContent>

      <TabsContent value="votes" className="mt-0 pt-6">
        <BillVotes billId={billId} />
      </TabsContent>

      <TabsContent value="amendments" className="mt-0 pt-6">
        <BillAmendments billId={billId} />
      </TabsContent>
    </Tabs>
  );
}
