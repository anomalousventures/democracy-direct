import { Icon, type IconName } from "@/components/icons";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: IconName;
  title: string;
  description: string;
  bordered?: boolean;
  children?: React.ReactNode;
}

export function EmptyState({ icon, title, description, bordered, children }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "text-center py-12 px-4",
        bordered && "py-16 px-8 bg-secondary/30 border border-border rounded-sm"
      )}
    >
      <div className="icon-box-accent mx-auto mb-4">
        <Icon name={icon} className="w-8 h-8 text-accent" />
      </div>
      <h3 className="text-lg font-semibold text-primary mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-md mx-auto">{description}</p>
      {children}
    </div>
  );
}
