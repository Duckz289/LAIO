'use client';

import { Filter, Search } from 'lucide-react';

import { VocabFilter } from '../types';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  activeFilter: VocabFilter;
  onFilterChange: (filter: VocabFilter) => void;
}

const filters: { label: string; value: VocabFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Due', value: 'due' },
  { label: 'Mastered', value: 'mastered' },
];

export default function SearchBar({
  searchTerm,
  onSearchChange,
  activeFilter,
  onFilterChange,
}: SearchBarProps) {
  return (
    <div className="rounded-3xl border border-white/70 bg-white/95 p-3 shadow-sm shadow-slate-200/60">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search vocabulary or meaning..."
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-semibold outline-none transition-all placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto rounded-2xl bg-slate-50 p-1">
          <div className="hidden items-center gap-2 px-2 text-xs font-bold uppercase tracking-wide text-slate-400 sm:flex">
            <Filter className="h-3.5 w-3.5" />
            Filter
          </div>
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => onFilterChange(filter.value)}
              className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-black transition-all ${
                activeFilter === filter.value
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
