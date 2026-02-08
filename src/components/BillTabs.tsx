import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BillVotes } from "./BillVotes";
import { BillAmendments } from "./BillAmendments";
import { BillSummary } from "./BillSummary";
import { cn } from "@/lib/utils";
import { useHashTabs, TAB_TRIGGER_CLASS } from "@/hooks/useHashTabs";
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

export function BillTabs({ billId, bill, voteCount, amendmentCount, className }: BillTabsProps) {
  const { activeTab, handleTabChange } = useHashTabs(TAB_HASH_MAP, "summary" as TabValue);

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className={cn("w-full", className)}>
      <div className="border-b border-border">
        <TabsList className="w-full justify-start h-auto p-0 bg-transparent rounded-none">
          <TabsTrigger value="summary" className={TAB_TRIGGER_CLASS}>
            Summary
          </TabsTrigger>
          <TabsTrigger value="votes" className={TAB_TRIGGER_CLASS}>
            Votes
            {voteCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-secondary text-muted-foreground rounded-full">
                {voteCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="amendments" className={TAB_TRIGGER_CLASS}>
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
