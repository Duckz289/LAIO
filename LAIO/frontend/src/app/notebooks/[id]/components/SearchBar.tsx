// frontend/src/app/notebooks/[id]/components/SearchBar.tsx

'use client';

import { Search, Filter } from 'lucide-react';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export default function SearchBar({ searchTerm, onSearchChange }: SearchBarProps) {
  return (
    <div className="flex gap-3">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Tìm kiếm từ vựng..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
        />
      </div>
      <button className="px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
        <Filter className="w-4 h-4 text-gray-500" />
      </button>
    </div>
  );
}