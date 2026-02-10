interface InlineErrorProps {
  title: string;
  message: string;
  onRetry?: () => void;
}

export function InlineError({ title, message, onRetry }: InlineErrorProps) {
  return (
    <div
      className="p-4 bg-destructive/10 border border-destructive/30 rounded-sm text-destructive text-sm"
      role="alert"
    >
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-destructive/80">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-3 text-sm font-medium underline hover:no-underline">
          Try again
        </button>
      )}
    </div>
  );
}
