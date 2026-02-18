import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { VotingRecord } from "./VotingRecord";
import { SponsoredBills } from "./SponsoredBills";
import { CampaignFinance } from "./CampaignFinance";
import { ContactInfo, type ContactInfoProps } from "./ContactInfo";
import { cn } from "@/lib/utils";
import { useHashTabs, TAB_TRIGGER_CLASS } from "@/hooks/useHashTabs";
import type { VoteWithPosition, VoteStats } from "@/db/queries/votes";
import type { CampaignFinanceData } from "@/db/queries/campaign-finance";
import type { Bill } from "@/db/schema";

export interface RepTabsProps {
  contactInfo: ContactInfoProps;
  votes: VoteWithPosition[];
  voteStats: VoteStats;
  bills: Bill[];
  billCount: number;
  financeData: CampaignFinanceData | null;
  className?: string;
}

type TabValue = "contact" | "votes" | "bills" | "finance";

const TAB_HASH_MAP: Record<string, TabValue> = {
  "#contact": "contact",
  "#votes": "votes",
  "#bills": "bills",
  "#finance": "finance",
};

export function RepTabs({
  contactInfo,
  votes,
  voteStats,
  bills,
  billCount,
  financeData,
  className,
}: RepTabsProps) {
  const { activeTab, handleTabChange } = useHashTabs(TAB_HASH_MAP, "contact" as TabValue);

  const voteCount = voteStats.totalVotes;

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className={cn("w-full", className)}>
      <div className="border-b border-border">
        <TabsList className="w-full justify-start h-auto p-0 bg-transparent rounded-none">
          <TabsTrigger value="contact" className={TAB_TRIGGER_CLASS}>
            Contact
          </TabsTrigger>
          <TabsTrigger value="votes" className={TAB_TRIGGER_CLASS}>
            <span className="hidden sm:inline">Voting Record</span>
            <span className="sm:hidden">Votes</span>
            {voteCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-secondary text-muted-foreground rounded-full">
                {voteCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="bills" className={TAB_TRIGGER_CLASS}>
            <span className="hidden sm:inline">Sponsored Bills</span>
            <span className="sm:hidden">Bills</span>
            {billCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-secondary text-muted-foreground rounded-full">
                {billCount}
              </span>
            )}
          </TabsTrigger>
          {financeData && (
            <TabsTrigger value="finance" className={TAB_TRIGGER_CLASS}>
              <span className="hidden sm:inline">Campaign Finance</span>
              <span className="sm:hidden">Finance</span>
            </TabsTrigger>
          )}
        </TabsList>
      </div>

      <TabsContent value="contact" className="mt-0 pt-6">
        <ContactInfo {...contactInfo} />
      </TabsContent>

      <TabsContent value="votes" className="mt-0 pt-6">
        <VotingRecord votes={votes} stats={voteStats} />
      </TabsContent>

      <TabsContent value="bills" className="mt-0 pt-6">
        <SponsoredBills bills={bills} totalCount={billCount} />
      </TabsContent>

      {financeData && (
        <TabsContent value="finance" className="mt-0 pt-6">
          <CampaignFinance data={financeData} />
        </TabsContent>
      )}
    </Tabs>
  );
}
