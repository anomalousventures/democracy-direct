import { Button } from "./button";
import { Spinner } from "./Spinner";

interface LoadMoreButtonProps {
  onClick: () => void;
  isLoading: boolean;
  label: string;
}

export function LoadMoreButton({ onClick, isLoading, label }: LoadMoreButtonProps) {
  return (
    <div className="pt-4 text-center">
      <Button
        variant="civicSecondary"
        onClick={onClick}
        disabled={isLoading}
        className="min-w-[200px]"
        data-testid="load-more-button"
      >
        {isLoading ? (
          <>
            <Spinner className="h-4 w-4 animate-spin mr-2" />
            Loading...
          </>
        ) : (
          label
        )}
      </Button>
    </div>
  );
}
