import { useState, useCallback, useMemo } from "react";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Toggle } from "./ui/toggle";
import { Card } from "./ui/card";

interface Template {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  body: string;
  issueTags: string[] | null;
  viewCount: number;
}

interface TemplateSearchProps {
  templates: Template[];
  availableTags: string[];
  repBioguideId?: string | null;
}

export function TemplateSearch({ templates, availableTags, repBioguideId }: TemplateSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        template.title.toLowerCase().includes(searchLower) ||
        template.body.toLowerCase().includes(searchLower);

      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.some((tag) =>
          template.issueTags?.some((t) => t.toLowerCase() === tag.toLowerCase())
        );

      return matchesSearch && matchesTags;
    });
  }, [templates, searchQuery, selectedTags]);

  const truncateBody = (body: string, maxLength: number = 100): string => {
    if (body.length <= maxLength) return body;
    return body.slice(0, maxLength).trim() + "...";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            type="search"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={handleSearchChange}
            variant="civic"
            aria-label="Search templates"
            data-testid="template-search-input"
          />
        </div>
      </div>

      {availableTags.length > 0 && (
        <fieldset>
          <legend className="sr-only">Filter by issue tags</legend>
          <div className="flex flex-wrap gap-2" data-testid="tag-filter">
            {availableTags.map((tag) => (
              <Toggle
                key={tag}
                variant="outline"
                size="sm"
                pressed={selectedTags.includes(tag)}
                onPressedChange={() => toggleTag(tag)}
                className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                data-testid="tag-filter-button"
              >
                {tag}
              </Toggle>
            ))}
          </div>
        </fieldset>
      )}

      <div data-testid="template-search-results" className="space-y-6">
        {filteredTemplates.length > 0 ? (
          filteredTemplates.map((template) => {
            const templateUrl = repBioguideId
              ? `/templates/${template.slug}?rep=${repBioguideId}`
              : `/templates/${template.slug}`;
            return (
              <Card key={template.id} variant="civic" data-testid="template-card" className="block">
                <a href={templateUrl} className="block">
                  <h2 className="text-xl font-semibold mb-2 text-primary hover:text-primary/80">
                    {template.title}
                  </h2>
                  <p className="text-muted-foreground mb-4 line-clamp-2">
                    {template.description || truncateBody(template.body)}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      {template.issueTags?.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="capitalize"
                          data-testid="issue-tag"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {template.viewCount.toLocaleString()} views
                    </span>
                  </div>
                </a>
              </Card>
            );
          })
        ) : (
          <div className="text-center py-12" data-testid="no-results">
            <p className="text-muted-foreground">
              {searchQuery || selectedTags.length > 0
                ? "No templates match your search."
                : "No templates available yet."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
