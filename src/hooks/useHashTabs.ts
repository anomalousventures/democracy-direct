import { useState, useEffect, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";

export function useHashTabs<T extends string>(hashMap: Record<string, T>, defaultTab: T) {
  const valueHashMap = useMemo(() => {
    const map: Record<string, string> = { [defaultTab]: "" };
    for (const [hash, value] of Object.entries(hashMap)) {
      map[value] = hash;
    }
    return map;
  }, [hashMap, defaultTab]);

  const getTab = useCallback((): T => {
    if (typeof window === "undefined") return defaultTab;
    return hashMap[window.location.hash] || defaultTab;
  }, [hashMap, defaultTab]);

  const [activeTab, setActiveTab] = useState<T>(defaultTab);

  useEffect(() => {
    setActiveTab(getTab());
    const handler = () => setActiveTab(getTab());
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, [getTab]);

  const handleTabChange = useCallback(
    (value: string) => {
      const tab = value as T;
      setActiveTab(tab);
      const hash = valueHashMap[tab];
      if (hash) {
        window.history.replaceState(null, "", hash);
      } else {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    },
    [valueHashMap]
  );

  return { activeTab, handleTabChange };
}

export const TAB_TRIGGER_CLASS = cn(
  "relative px-4 py-3 text-sm font-medium transition-colors rounded-none",
  "text-muted-foreground hover:text-foreground",
  "data-[state=active]:text-primary data-[state=active]:font-semibold",
  "data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-accent"
);
