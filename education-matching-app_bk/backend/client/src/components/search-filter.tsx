import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

interface FilterOption {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

interface SearchFilterProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters?: FilterOption[];
  filterValues?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  onReset?: () => void;
  testIdPrefix?: string;
}

export function SearchFilter({
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  filters = [],
  filterValues = {},
  onFilterChange,
  onReset,
  testIdPrefix = "filter",
}: SearchFilterProps) {
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters =
    searchValue ||
    Object.values(filterValues).some((v) => v && v !== "all");

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
            data-testid={`${testIdPrefix}-search`}
          />
        </div>
        {filters.length > 0 && (
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            data-testid={`${testIdPrefix}-toggle`}
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                Active
              </span>
            )}
          </Button>
        )}
        {hasActiveFilters && onReset && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            data-testid={`${testIdPrefix}-reset`}
          >
            <X className="h-4 w-4 mr-1" />
            Reset
          </Button>
        )}
      </div>

      {showFilters && filters.length > 0 && (
        <div className="flex flex-wrap gap-4 p-4 rounded-lg bg-muted/50">
          {filters.map((filter) => (
            <div key={filter.key} className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {filter.label}
              </label>
              <Select
                value={filterValues[filter.key] || "all"}
                onValueChange={(value) => onFilterChange?.(filter.key, value)}
              >
                <SelectTrigger
                  className="w-40"
                  data-testid={`${testIdPrefix}-${filter.key}`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {filter.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
