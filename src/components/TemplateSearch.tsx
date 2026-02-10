import { useState, useCallback, useEffect } from "react";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Toggle } from "./ui/toggle";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { Icon } from "@/components/icons";
import { Spinner } from "./ui/Spinner";
import { InlineError } from "./ui/InlineError";
import { getPreviewLines } from "@/lib/markdown";
import { useDebounce } from "@/hooks/useDebounce";

interface Template {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  body: string;
  tags: string[];
  viewCount: number;
  useCount: number;
}

interface SearchResponse {
  templates: Template[];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
  };
  availableTags: string[];
}

interface TemplateSearchProps {
  repBioguideId?: string | null;
  billFilter?: string | null;
  billTitle?: string | null;
}

function TemplateCardSkeleton() {
  return (
    <Card variant="civic" className="block animate-pulse">
      <Skeleton className="h-7 w-3/4 mb-3" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-2/3 mb-4" />
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-20" />
      </div>
    </Card>
  );
}

export function TemplateSearch({ repBioguideId, billFilter, billTitle }: TemplateSearchProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const fetchTemplates = useCallback(
    async (nextCursor?: string, append = false) => {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const params = new URLSearchParams();
      params.set("limit", "20");

      if (nextCursor) {
        params.set("cursor", nextCursor);
      }

      if (debouncedSearch.trim()) {
        params.set("search", debouncedSearch.trim());
      }

      if (selectedTags.length > 0) {
        params.set("tags", selectedTags.join(","));
      }

      if (billFilter) {
        params.set("bill", billFilter);
      }

      try {
        const response = await fetch(`/api/templates/search?${params.toString()}`);

        if (!response.ok) {
          throw new Error("Failed to fetch templates");
        }

        const data: SearchResponse = await response.json();

        if (append) {
          setTemplates((prev) => [...prev, ...data.templates]);
        } else {
          setTemplates(data.templates);
        }

        setCursor(data.pagination.nextCursor);
        setHasMore(data.pagination.hasMore);
        setAvailableTags(data.availableTags);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [debouncedSearch, selectedTags, billFilter]
  );

  useEffect(() => {
    fetchTemplates();
  }, [debouncedSearch, selectedTags, fetchTemplates]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const handleLoadMore = useCallback(() => {
    if (cursor && hasMore && !isLoadingMore) {
      fetchTemplates(cursor, true);
    }
  }, [cursor, hasMore, isLoadingMore, fetchTemplates]);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedTags([]);
  }, []);

  const hasActiveFilters = !!searchQuery.trim() || selectedTags.length > 0 || !!billFilter;

  return (
    <div className="space-y-8">
      {billFilter && (
        <div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-accent/5 border border-accent/20 rounded-sm"
          data-testid="bill-filter-banner"
        >
          <p className="text-sm text-primary">
            Showing templates linked to{" "}
            <span className="font-semibold text-accent">{billFilter}</span>
            {billTitle && <span className="text-muted-foreground"> — {billTitle}</span>}
          </p>
          <a
            href={repBioguideId ? `/templates?rep=${repBioguideId}` : "/templates"}
            className="text-sm font-medium text-primary hover:text-accent transition-colors"
          >
            Show all templates
          </a>
        </div>
      )}

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
          <Icon name="search" className="h-5 w-5 text-muted-foreground" />
        </div>
        <Input
          type="search"
          placeholder="Search by title or description..."
          value={searchQuery}
          onChange={handleSearchChange}
          variant="civic"
          className="pl-12"
          aria-label="Search templates"
          data-testid="template-search-input"
        />
        {isLoading && searchQuery && (
          <div className="absolute inset-y-0 right-0 pr-5 flex items-center pointer-events-none">
            <Spinner className="h-5 w-5 text-primary animate-spin" />
          </div>
        )}
      </div>

      {availableTags.length > 0 && (
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
            Filter by Topic
          </legend>
          <div className="flex flex-wrap gap-2" data-testid="tag-filter">
            {availableTags.map((tag) => (
              <Toggle
                key={tag}
                variant="filter"
                pressed={selectedTags.includes(tag)}
                onPressedChange={() => toggleTag(tag)}
                className="capitalize px-4 py-2 border-2 data-[state=on]:shadow-md"
                data-testid="tag-filter-button"
              >
                {tag}
              </Toggle>
            ))}
          </div>
        </fieldset>
      )}

      {hasActiveFilters && (
        <div className="flex items-center justify-between py-3 px-4 bg-secondary/50 border border-border rounded-sm">
          <p className="text-sm text-muted-foreground">
            {isLoading ? (
              "Searching..."
            ) : (
              <>
                <span className="font-semibold text-primary">{templates.length}</span>{" "}
                {templates.length === 1 ? "template" : "templates"} found
                {hasMore && !isLoading && " (scroll for more)"}
              </>
            )}
          </p>
          <button
            onClick={clearFilters}
            className="text-sm text-primary hover:text-accent font-medium transition-colors"
            aria-label="Clear all filters"
            data-testid="clear-filters-button"
          >
            Clear filters
          </button>
        </div>
      )}

      {error && (
        <InlineError
          title="Unable to load templates"
          message={error}
          onRetry={() => fetchTemplates()}
        />
      )}

      <div data-testid="template-search-results" className="space-y-6">
        {isLoading && !templates.length ? (
          <>
            <TemplateCardSkeleton />
            <TemplateCardSkeleton />
            <TemplateCardSkeleton />
          </>
        ) : templates.length > 0 ? (
          <>
            {templates.map((template, index) => {
              const templateUrl = repBioguideId
                ? `/templates/${template.slug}?rep=${repBioguideId}`
                : `/templates/${template.slug}`;

              return (
                <Card
                  key={template.id}
                  variant="civic"
                  data-testid="template-card"
                  className="block group hover:shadow-[var(--shadow-civic-lg)] transition-shadow duration-300"
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  <a href={templateUrl} className="block">
                    <h2 className="text-xl font-semibold mb-2 text-primary group-hover:text-accent transition-colors duration-200">
                      {template.title}
                    </h2>
                    <p className="text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
                      {template.description || getPreviewLines(template.body, 3)}
                    </p>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex flex-wrap gap-2 min-w-0">
                        {template.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="capitalize text-xs"
                            data-testid="issue-tag"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground shrink-0">
                        <span className="flex items-center gap-1.5" title="Views">
                          <Icon name="eye" className="w-4 h-4" />
                          {template.viewCount.toLocaleString()}
                        </span>
                        {template.useCount > 0 && (
                          <span className="flex items-center gap-1.5 text-accent" title="Uses">
                            <Icon name="star" className="w-4 h-4" />
                            {template.useCount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </a>
                </Card>
              );
            })}

            {hasMore && (
              <div className="pt-4 text-center">
                <Button
                  variant="civicSecondary"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="min-w-[200px]"
                  data-testid="load-more-button"
                >
                  {isLoadingMore ? (
                    <>
                      <Spinner className="h-4 w-4 animate-spin mr-2" />
                      Loading...
                    </>
                  ) : (
                    "Load More Templates"
                  )}
                </Button>
              </div>
            )}
          </>
        ) : !error ? (
          <div
            className="text-center py-16 px-8 bg-secondary/30 border border-border rounded-sm"
            data-testid="no-results"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                />
              </svg>
            </div>
            {billFilter ? (
              <>
                <p className="text-muted-foreground text-lg">
                  No templates linked to <span className="font-semibold">{billFilter}</span> yet.
                </p>
                <a
                  href={`/templates/new?bill=${encodeURIComponent(billFilter)}`}
                  className="mt-4 inline-block text-primary hover:text-accent font-medium transition-colors"
                >
                  Be the first to write one
                </a>
              </>
            ) : (
              <>
                <p className="text-muted-foreground text-lg">
                  {hasActiveFilters
                    ? "No templates match your search."
                    : "No templates available yet."}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="mt-4 text-primary hover:text-accent font-medium transition-colors"
                  >
                    Clear filters and show all
                  </button>
                )}
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
