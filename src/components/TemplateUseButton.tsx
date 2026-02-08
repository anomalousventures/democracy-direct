import { useCallback, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useMe } from "@/hooks/useMe";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { SavedDistrict } from "@/lib/saved-district";

interface TemplateUseButtonProps {
  href: string;
  templateSlug: string;
  templateTitle: string;
  repBioguideId?: string | null;
}

export function TemplateUseButton({
  href,
  templateSlug,
  templateTitle,
  repBioguideId,
}: TemplateUseButtonProps) {
  const { capture } = useAnalytics();
  const { user, isLoggedIn, isLoading } = useMe();
  const districtStorage = useLocalStorage<SavedDistrict>("DISTRICT");
  const [resolvedHref, setResolvedHref] = useState(href);

  useEffect(() => {
    if (repBioguideId || isLoading) {
      return;
    }

    let cancelled = false;

    const resolveHref = async () => {
      if (isLoggedIn && user?.savedState && user?.savedDistrict) {
        if (!cancelled) {
          setResolvedHref(
            `/reps/${user.savedState.toLowerCase()}/${user.savedDistrict.toLowerCase()}?template=${templateSlug}`
          );
        }
        return;
      }

      const localDistrict = await districtStorage.get();
      if (localDistrict && !cancelled) {
        setResolvedHref(
          `/reps/${localDistrict.state.toLowerCase()}/${localDistrict.district.toLowerCase()}?template=${templateSlug}`
        );
      }
    };

    resolveHref();

    return () => {
      cancelled = true;
    };
  }, [repBioguideId, templateSlug, isLoading, isLoggedIn, user, districtStorage]);

  const handleClick = useCallback(() => {
    capture("template_used", {
      templateSlug,
      templateTitle,
      repBioguideId: repBioguideId || null,
    });
  }, [capture, templateSlug, templateTitle, repBioguideId]);

  return (
    <Button variant="civic" asChild className="text-center flex-1 sm:flex-none">
      <a href={resolvedHref} onClick={handleClick} data-testid="use-template-button">
        Use This Template
      </a>
    </Button>
  );
}
