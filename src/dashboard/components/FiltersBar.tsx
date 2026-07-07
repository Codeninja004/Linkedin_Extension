import type { Tag } from '@/types';
import { PIPELINE_STAGES, PIPELINE_STAGE_LABELS, PRIORITY_LEVELS, PRIORITY_LABELS } from '@/types/contact';
import type { DashboardFilters } from '../hooks/useContactsFilter';
import { SearchIcon } from '@/sidebar/components/icons';

interface FiltersBarProps {
  filters: DashboardFilters;
  onChange: (filters: DashboardFilters) => void;
  companies: string[];
  tags: Tag[];
}

export function FiltersBar({ filters, onChange, companies, tags }: FiltersBarProps) {
  function set<K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[220px] flex-1">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          className="lcrm-input pl-8"
          placeholder="Search name, company, headline, notes…"
          value={filters.keyword}
          onChange={(e) => set('keyword', e.target.value)}
        />
      </div>

      <select className="lcrm-select w-auto" value={filters.stage} onChange={(e) => set('stage', e.target.value as DashboardFilters['stage'])}>
        <option value="all">All Stages</option>
        {PIPELINE_STAGES.map((stage) => (
          <option key={stage} value={stage}>
            {PIPELINE_STAGE_LABELS[stage]}
          </option>
        ))}
      </select>

      <select className="lcrm-select w-auto" value={filters.priority} onChange={(e) => set('priority', e.target.value as DashboardFilters['priority'])}>
        <option value="all">All Priorities</option>
        {PRIORITY_LEVELS.map((p) => (
          <option key={p} value={p}>
            {PRIORITY_LABELS[p]}
          </option>
        ))}
      </select>

      <select className="lcrm-select w-auto" value={filters.tagId} onChange={(e) => set('tagId', e.target.value)}>
        <option value="all">All Tags</option>
        {tags.map((tag) => (
          <option key={tag.id} value={tag.id}>
            {tag.name}
          </option>
        ))}
      </select>

      <select className="lcrm-select w-auto" value={filters.company} onChange={(e) => set('company', e.target.value)}>
        <option value="all">All Companies</option>
        {companies.map((company) => (
          <option key={company} value={company}>
            {company}
          </option>
        ))}
      </select>
    </div>
  );
}
