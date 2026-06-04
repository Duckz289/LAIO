// frontend/src/app/notebooks/[id]/components/StatsCard.tsx

'use client';

import { Notebook } from '../types';

interface StatsCardProps {
  notebook: Notebook;
}

export default function StatsCard({ notebook }: StatsCardProps) {
  const masteredPercent = notebook.totalVocabs > 0 
    ? (notebook.masteredVocabs / notebook.totalVocabs) * 100 
    : 0;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <h3 className="font-semibold text-gray-700 mb-4">📊 Thống kê</h3>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-gray-500">📚 Tổng từ</span>
          <span className="font-bold text-gray-800">{notebook.totalVocabs}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500">✅ Đã nhớ</span>
          <span className="font-bold text-green-600">{notebook.masteredVocabs}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500">⏳ Cần ôn</span>
          <span className="font-bold text-amber-600">{notebook.dueVocabs}</span>
        </div>
        <div className="mt-3 pt-3 border-t">
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${masteredPercent}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">Tiến độ: {Math.round(masteredPercent)}%</p>
        </div>
      </div>
    </div>
  );
}