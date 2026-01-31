import { useState, useEffect, useRef, useCallback } from "react";
import { lookupZip, type ZipLookupResult } from "../lib/zip-lookup";

interface ZipLookupProps {
  autoFocus?: boolean;
  templateSlug?: string;
  initialZip?: string;
}

export function ZipLookup({ autoFocus = true, templateSlug, initialZip }: ZipLookupProps) {
  const [zip, setZip] = useState(initialZip || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ZipLookupResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasAutoTriggered = useRef(false);

  const triggerLookup = useCallback(
    async (zipCode: string) => {
      setIsLoading(true);
      setError(null);
      setResult(null);

      try {
        const lookupResult = await lookupZip(zipCode);

        if (lookupResult.type === "error") {
          setError(lookupResult.message);
        } else if (lookupResult.type === "single") {
          const params = new URLSearchParams();
          if (templateSlug) params.set("template", templateSlug);
          const queryString = params.toString();
          window.location.href = `/zip/${zipCode}${queryString ? `?${queryString}` : ""}`;
        } else {
          setResult(lookupResult);
        }
      } catch {
        setError("Failed to look up ZIP code. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [templateSlug]
  );

  useEffect(() => {
    if (autoFocus && inputRef.current && !initialZip) {
      inputRef.current.focus();
    }
  }, [autoFocus, initialZip]);

  useEffect(() => {
    if (initialZip && initialZip.length === 5 && !hasAutoTriggered.current) {
      hasAutoTriggered.current = true;
      triggerLookup(initialZip);
    }
  }, [initialZip, triggerLookup]);

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 5);
    setZip(value);
    setError(null);
    setResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (zip.length !== 5) {
      setError("Invalid ZIP code format. Please enter a 5-digit ZIP code.");
      return;
    }
    triggerLookup(zip);
  };

  const handleDistrictSelect = (district: string) => {
    const params = new URLSearchParams();
    params.set("district", district);
    if (templateSlug) {
      params.set("template", templateSlug);
    }
    window.location.href = `/zip/${zip}?${params.toString()}`;
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative group">
          <div
            className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-primary opacity-20 blur-sm group-hover:opacity-30 transition-opacity duration-500"
            aria-hidden="true"
          />
          <div className="relative flex flex-col sm:flex-row gap-0 bg-white border-2 border-border rounded-md overflow-hidden">
            <div className="flex-1 relative">
              <label htmlFor="zip-input" className="sr-only">
                Enter your ZIP code
              </label>
              <input
                ref={inputRef}
                id="zip-input"
                name="zip"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{5}"
                maxLength={5}
                value={zip}
                onChange={handleZipChange}
                placeholder="Enter your ZIP code"
                aria-label="ZIP code"
                aria-describedby={error ? "zip-error" : undefined}
                aria-invalid={error ? "true" : undefined}
                disabled={isLoading}
                className="w-full px-6 py-5 text-xl tracking-widest font-medium bg-transparent border-0 focus:outline-none focus:ring-0 placeholder:text-muted-foreground placeholder:tracking-normal placeholder:font-normal placeholder:italic disabled:opacity-50"
              />
              {zip.length > 0 && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={`w-2 h-2 rounded-full transition-all duration-200 ${
                        i < zip.length ? "bg-primary scale-100" : "bg-border scale-75"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading || zip.length !== 5}
              className="relative overflow-hidden px-8 py-5 font-semibold tracking-wide uppercase text-sm bg-primary text-primary-foreground border-t-2 sm:border-t-0 sm:border-l-2 border-primary transition-colors duration-200 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed group/btn"
            >
              <span
                className={`flex items-center justify-center gap-2 transition-all duration-300 ${isLoading ? "opacity-0" : "opacity-100"}`}
              >
                <span>Find My Reps</span>
                <svg
                  className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </span>
              {isLoading && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex gap-1">
                    <span
                      className="w-2 h-2 rounded-full bg-primary-foreground animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="w-2 h-2 rounded-full bg-primary-foreground animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="w-2 h-2 rounded-full bg-primary-foreground animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </span>
                  <span className="sr-only">Searching...</span>
                </span>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div id="zip-error" role="alert" className="mt-4 alert-error animate-fade-up">
            <svg
              className="w-5 h-5 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}
      </form>

      {result && result.type === "ambiguous" && (
        <div className="mt-8 animate-fade-up">
          <div className="card-civic-lg">
            <h3 className="text-lg font-semibold text-primary mb-2">
              Your ZIP code spans multiple districts
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              Please select your congressional district to see your representative:
            </p>
            <div className="space-y-3">
              {result.options.map((option, index) => (
                <button
                  key={`${option.state}-${option.district}`}
                  onClick={() => handleDistrictSelect(option.district)}
                  className="w-full p-4 text-left bg-secondary hover:bg-muted border border-border rounded-md transition-all duration-200 hover:border-primary group animate-fade-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-primary">
                        {option.state} District{" "}
                        {option.district === "0" ? "At-Large" : option.district}
                      </span>
                      <span className="ml-3 text-sm text-muted-foreground">
                        {parseFloat((option.proportion * 100).toFixed(2))}% of ZIP area
                      </span>
                    </div>
                    <svg
                      className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-200"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
