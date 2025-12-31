
'use client';
import { useLanguage } from "@/lib/i18n/language-provider";
import { cn } from "@/lib/utils";
import type { EventCategory } from "@/lib/types";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";

export interface EventFilters {
  showPastEvents?: boolean;
  type?: 'ALL' | 'ONLINE' | 'OFFLINE';
  city?: string;
  categories?: string[];
}

export interface CityFilterOption {
  value: string;
  label: string;
}

interface EventsFilterBarProps {
  filters: EventFilters;
  onFilterChange: (filters: EventFilters) => void;
  cities: CityFilterOption[];
  categories: EventCategory[];
  isLoading: boolean;
  className?: string;
}

export function EventsFilterBar({
  filters,
  onFilterChange,
  cities,
  categories,
  isLoading,
  className,
}: EventsFilterBarProps) {
  const { t } = useLanguage();

  const handleFilterChange = (key: keyof EventFilters, value: any) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center p-4 rounded-lg border bg-card", className)}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="type-filter" className="text-sm font-medium">{t('filters.eventType')}</Label>
        <RadioGroup
          id="type-filter"
          value={filters.type || 'ALL'}
          onValueChange={(value) => handleFilterChange('type', value as 'ALL' | 'ONLINE' | 'OFFLINE')}
          className="flex"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="ALL" id="type-all" />
            <Label htmlFor="type-all">{t('filters.all')}</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="ONLINE" id="type-online" />
            <Label htmlFor="type-online">{t('event.online')}</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="OFFLINE" id="type-offline" />
            <Label htmlFor="type-offline">{t('event.offline')}</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="city-filter" className="text-sm font-medium">{t('filters.city')}</Label>
        <Select
          value={filters.city || 'all'}
          onValueChange={(value) => handleFilterChange('city', value)}
          disabled={isLoading || cities.length === 0}
        >
          <SelectTrigger id="city-filter">
            <SelectValue placeholder={t('filters.allCities')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.allCities')}</SelectItem>
            {cities.map(city => (
              <SelectItem key={city.value} value={city.value}>{city.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="category-filter" className="text-sm font-medium">{t('filters.category')}</Label>
        <Select
          value={filters.categories?.[0] || 'all'}
          onValueChange={(value) => handleFilterChange('categories', value === 'all' ? [] : [value])}
          disabled={isLoading || categories.length === 0}
        >
          <SelectTrigger id="category-filter">
            <SelectValue placeholder={t('filters.allCategories')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.allCategories')}</SelectItem>
            {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2 justify-self-start md:justify-self-end">
        <Switch
          id="show-past-events"
          checked={filters.showPastEvents ?? false}
          onCheckedChange={(checked) => handleFilterChange('showPastEvents', checked)}
        />
        <Label htmlFor="show-past-events">{t('filters.showPast')}</Label>
      </div>
    </div>
  )
}
