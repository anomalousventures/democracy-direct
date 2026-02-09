import { cn } from "@/lib/utils";
import type { VotePosition } from "@/lib/types/legislation";

type PositionStyle = {
  label: string;
  bg: string;
  text: string;
  border: string;
};

export const POSITION_STYLES: Record<VotePosition, PositionStyle> = {
  yea: {
    label: "Yea",
    bg: "bg-green-100",
    text: "text-green-800",
    border: "border-green-200",
  },
  nay: {
    label: "Nay",
    bg: "bg-red-100",
    text: "text-red-800",
    border: "border-red-200",
  },
  not_voting: {
    label: "Not Voting",
    bg: "bg-gray-100",
    text: "text-gray-700",
    border: "border-gray-200",
  },
  present: {
    label: "Present",
    bg: "bg-amber-100",
    text: "text-amber-800",
    border: "border-amber-200",
  },
};

export function PositionBadge({
  position,
  className,
}: {
  position: VotePosition;
  className?: string;
}) {
  const style = POSITION_STYLES[position];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-xs font-semibold border rounded-sm",
        style.bg,
        style.text,
        style.border,
        className
      )}
    >
      {style.label}
    </span>
  );
}
