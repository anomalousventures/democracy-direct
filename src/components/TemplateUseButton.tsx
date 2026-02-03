import { useCallback, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAnalytics } from "@/hooks/useAnalytics";
import { getSavedDistrict } from "@/lib/saved-district";

interface TemplateUseButtonProps {
  href: string;
  templateSlug: string;
  templateTitle: string;
  repBioguideId?: string | null;
  savedState?: string | null;
  savedDistrict?: string | null;
}

export function TemplateUseButton({
  href,
  templateSlug,
  templateTitle,
  repBioguideId,
  savedState,
  savedDistrict,
}: TemplateUseButtonProps) {
  const { capture } = useAnalytics();
  const [resolvedHref, setResolvedHref] = useState(href);

  useEffect(() => {
    if (repBioguideId) {
      return;
    }
    if (savedState && savedDistrict) {
      setResolvedHref(`/reps/${savedState}/${savedDistrict}?template=${templateSlug}`);
      return;
    }
    const localDistrict = getSavedDistrict();
    if (localDistrict) {
      setResolvedHref(
        `/reps/${localDistrict.state}/${localDistrict.district}?template=${templateSlug}`
      );
    }
  }, [repBioguideId, templateSlug, savedState, savedDistrict]);

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
