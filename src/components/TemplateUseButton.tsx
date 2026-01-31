import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useAnalytics } from "@/hooks/useAnalytics";

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

  const handleClick = useCallback(() => {
    capture("template_used", {
      templateSlug,
      templateTitle,
      repBioguideId: repBioguideId || null,
    });
  }, [capture, templateSlug, templateTitle, repBioguideId]);

  return (
    <Button variant="civic" asChild className="text-center flex-1 sm:flex-none">
      <a href={href} onClick={handleClick} data-testid="use-template-button">
        Use This Template
      </a>
    </Button>
  );
}
