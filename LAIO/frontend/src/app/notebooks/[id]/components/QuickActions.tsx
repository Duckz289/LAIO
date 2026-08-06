'use client';

import { Images, Mic, PenTool, Sparkles } from 'lucide-react';

const actions = [
  { icon: Sparkles, label: 'Grammar assist', helper: 'Coming soon' },
  { icon: Mic, label: 'Pronunciation drill', helper: 'Use card speaker now' },
  { icon: Images, label: 'OCR import', helper: 'Coming soon' },
  { icon: PenTool, label: 'Handwriting mode', helper: 'Coming soon' },
];

export default function QuickActions() {
  return (
    <div className="rounded-3xl border border-white/70 bg-white/95 p-5 shadow-sm shadow-slate-200/60">
      <h3 className="text-sm font-black text-slate-950">Quick actions</h3>
      <p className="mt-1 text-xs font-medium text-slate-400">UI placeholders only, no new API.</p>

      <div className="mt-4 space-y-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              type="button"
              disabled
              className="flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3 text-left opacity-70"
              title="This action is not connected to an API yet."
            >
              <div className="rounded-xl bg-white p-2 text-indigo-600 shadow-sm">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">{action.label}</p>
                <p className="text-xs font-medium text-slate-400">{action.helper}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
