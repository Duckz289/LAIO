// frontend/src/app/notebooks/[id]/components/QuickActions.tsx

'use client';

import { Sparkles, Mic, Images, PenTool } from 'lucide-react';

export default function QuickActions() {
  const actions = [
    { icon: Sparkles, label: 'Gợi ý cấu trúc ngữ pháp', color: 'text-purple-500', bg: 'bg-purple-50' },
    { icon: Mic, label: 'Phát âm tất cả từ', color: 'text-blue-500', bg: 'bg-blue-50' },
    { icon: Images, label: 'OCR từ ảnh chụp', color: 'text-green-500', bg: 'bg-green-50' },
    { icon: PenTool, label: 'Vẽ / viết tay', color: 'text-orange-500', bg: 'bg-orange-50' },
  ];

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <h3 className="font-semibold text-gray-700 mb-3">⚡ Tiện ích nhanh</h3>
      <div className="space-y-2">
        {actions.map((action, idx) => (
          <button
            key={idx}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl ${action.bg} hover:opacity-80 transition-all`}
          >
            <action.icon className={`w-4 h-4 ${action.color}`} />
            <span className="text-sm text-gray-700">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}