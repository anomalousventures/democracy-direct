import { Icon } from "@/components/icons";
import { Button, type ButtonProps } from "./button";
import { cn } from "@/lib/utils";

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
}

const LoadingButton = ({
  loading = false,
  loadingText,
  children,
  disabled,
  className,
  ...props
}: LoadingButtonProps) => {
  return (
    <Button disabled={loading || disabled} className={cn(className)} {...props}>
      {loading && <Icon name="loader" className="h-4 w-4 animate-spin" />}
      {loading && loadingText ? loadingText : children}
    </Button>
  );
};

export { LoadingButton };
