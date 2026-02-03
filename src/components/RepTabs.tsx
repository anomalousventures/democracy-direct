import { useState, useEffect, useCallback, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { VotingRecord } from "./VotingRecord";
import { SponsoredBills } from "./SponsoredBills";
import { ContactInfo, type ContactInfoProps } from "./ContactInfo";
import { cn } from "@/lib/utils";
import type { VoteWithPosition, VoteStats } from "@/db/queries/votes";
import type { Bill } from "@/db/schema";
import type { Chamber } from "@/lib/types/legislation";

export interface RepTabsProps {
  bioguideId: string;
  chamber: Chamber;
  contactInfo: ContactInfoProps;
  votes: VoteWithPosition[];
  voteStats: VoteStats;
  bills: Bill[];
  billCount: number;
  className?: string;
}

type TabValue = "contact" | "votes" | "bills";

const TAB_HASH_MAP: Record<string, TabValue> = {
  "#votes": "votes",
  "#bills": "bills",
  "#contact": "contact",
};

const VALUE_HASH_MAP: Record<TabValue, string> = {
  votes: "#votes",
  bills: "#bills",
  contact: "",
};

function getInitialTab(): TabValue {
  if (typeof window === "undefined") return "contact";
  const hash = window.location.hash;
  return TAB_HASH_MAP[hash] || "contact";
}

export function RepTabs({
  bioguideId,
  chamber,
  contactInfo,
  votes,
  voteStats,
  bills,
  billCount,
  className,
}: RepTabsProps) {
  const [activeTab, setActiveTab] = useState<TabValue>("contact");

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

  const voteCount = voteStats.totalVotes;

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
      <div className="border-b border-border bg-white rounded-t-sm">
        <TabsList className="w-full justify-start h-auto p-0 bg-transparent rounded-none">
          <TabsTrigger value="contact" className={tabTriggerClass}>
            Contact
          </TabsTrigger>
          <TabsTrigger value="votes" className={tabTriggerClass}>
            Voting Record
            {voteCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-secondary text-muted-foreground rounded-full">
                {voteCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="bills" className={tabTriggerClass}>
            Sponsored Bills
            {billCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-secondary text-muted-foreground rounded-full">
                {billCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent
        value="contact"
        className="mt-0 p-6 bg-white border-x border-b border-border rounded-b-sm"
      >
        <ContactInfo {...contactInfo} />
      </TabsContent>

      <TabsContent
        value="votes"
        className="mt-0 p-6 bg-white border-x border-b border-border rounded-b-sm"
      >
        <VotingRecord votes={votes} stats={voteStats} bioguideId={bioguideId} chamber={chamber} />
      </TabsContent>

      <TabsContent
        value="bills"
        className="mt-0 p-6 bg-white border-x border-b border-border rounded-b-sm"
      >
        <SponsoredBills bills={bills} totalCount={billCount} bioguideId={bioguideId} />
      </TabsContent>
    </Tabs>
  );
}
