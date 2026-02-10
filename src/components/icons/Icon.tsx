import { iconPaths, type IconName } from "./paths";

interface IconProps {
  name: IconName;
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
}

export function Icon({ name, className = "w-4 h-4", "aria-hidden": ariaHidden }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={ariaHidden}
      dangerouslySetInnerHTML={{ __html: iconPaths[name] }}
    />
  );
}

export type { IconName };
