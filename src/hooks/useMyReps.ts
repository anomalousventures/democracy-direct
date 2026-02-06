import { useState, useEffect } from "react";
import { useMe } from "@/hooks/useMe";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { isValidSavedDistrict, type SavedDistrict } from "@/lib/saved-district";
import type { RepresentativesResponse, RepresentativeInfo } from "@/pages/api/user/representatives";

interface UseMyRepsResult {
  reps: RepresentativeInfo[];
  isLoading: boolean;
  hasDistrict: boolean;
}

const sessionCache = new Map<string, RepresentativeInfo[]>();

export function useMyReps(): UseMyRepsResult {
  const { user, isLoading: userLoading } = useMe();
  const districtStorage = useLocalStorage<SavedDistrict>("DISTRICT");
  const [reps, setReps] = useState<RepresentativeInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [district, setDistrict] = useState<SavedDistrict | null>(null);

  useEffect(() => {
    if (userLoading || !districtStorage.isReady) return;

    if (user?.savedState && user?.savedDistrict) {
      setDistrict({ state: user.savedState, district: user.savedDistrict });
      return;
    }

    districtStorage.get().then((saved) => {
      if (saved && isValidSavedDistrict(saved)) {
        setDistrict(saved);
      } else {
        setDistrict(null);
        setIsLoading(false);
      }
    });
  }, [user, userLoading, districtStorage.isReady]);

  useEffect(() => {
    if (!district) return;

    const cacheKey = `${district.state}-${district.district}`;
    const cached = sessionCache.get(cacheKey);
    if (cached) {
      setReps(cached);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    fetch(`/api/user/representatives?state=${district.state}&district=${district.district}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch representatives");
        return res.json() as Promise<RepresentativesResponse>;
      })
      .then((data) => {
        sessionCache.set(cacheKey, data.representatives);
        setReps(data.representatives);
      })
      .catch(() => {
        setReps([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [district]);

  return {
    reps,
    isLoading: userLoading || isLoading,
    hasDistrict: district !== null,
  };
}
