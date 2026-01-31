import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { LoadingButton } from "@/components/ui/loading-button";
import { useAnalytics } from "@/hooks/useAnalytics";

const FLAG_REASONS = [
  { value: "spam", label: "Spam or promotional content" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "hate_speech", label: "Hate speech" },
  { value: "misinformation", label: "Misinformation" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "other", label: "Other" },
] as const;

interface TemplateReportButtonProps {
  templateSlug: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export function TemplateReportButton({
  templateSlug,
  variant = "destructive",
}: TemplateReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { capture } = useAnalytics();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!selectedReason) {
        toast.error("Please select a reason");
        return;
      }

      setIsSubmitting(true);

      try {
        const response = await fetch(`/api/templates/${templateSlug}/flag`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reason: selectedReason,
            details: details.trim() || undefined,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to report template");
        }

        capture("template_reported", {
          templateSlug,
          reason: selectedReason,
        });

        toast.success(result.message || "Template reported successfully");
        setIsOpen(false);
        setSelectedReason("");
        setDetails("");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to report template";
        toast.error(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [templateSlug, selectedReason, details, capture]
  );

  return (
    <>
      <Button
        type="button"
        variant={variant}
        onClick={() => setIsOpen(true)}
        data-testid="report-button"
      >
        Report
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report Template</DialogTitle>
            <DialogDescription>
              Help us maintain quality by reporting inappropriate content. Your report will be
              reviewed by our team.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <Label>Reason for reporting</Label>
              <div className="space-y-2">
                {FLAG_REASONS.map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="reason"
                      value={value}
                      checked={selectedReason === value}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="size-4 text-primary"
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="details">Additional details (optional)</Label>
              <textarea
                id="details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Provide any additional context..."
                className="w-full min-h-[80px] px-3 py-2 text-sm border border-input rounded-md bg-background"
                maxLength={500}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <LoadingButton
                type="submit"
                variant="destructive"
                loading={isSubmitting}
                loadingText="Reporting..."
                disabled={!selectedReason}
              >
                Submit Report
              </LoadingButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
