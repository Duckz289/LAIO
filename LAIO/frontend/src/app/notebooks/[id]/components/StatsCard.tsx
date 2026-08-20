'use client';

import { BookOpen, CalendarClock, CheckCircle2, Target } from 'lucide-react';

import { Notebook } from '../types';

interface StatsCardProps {
  notebook: Notebook;
}

export default function StatsCard({ notebook }: StatsCardProps) {
  const masteredPercent = notebook.totalVocabs > 0
    ? Math.round((notebook.masteredVocabs / notebook.totalVocabs) * 100)
    : 0;

  const stats = [
    { label: 'Total words', value: notebook.totalVocabs, icon: BookOpen },
    { label: 'Mastered', value: notebook.masteredVocabs, icon: CheckCircle2 },
    { label: 'Due today', value: notebook.dueVocabs, icon: CalendarClock },
    { label: 'Progress', value: `${masteredPercent}%`, icon: Target },
  ];

  return (
    <div className="rounded-3xl border border-[#173f3420] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-brand-forest">Notebook stats</h3>
          <p className="mt-1 text-xs font-medium text-brand-faint">SRS state from current vocab list</p>
        </div>
        <div className="rounded-2xl bg-brand-sand p-3 text-brand-forest">
          <Target className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-2xl bg-brand-paper p-3">
              <Icon className="h-4 w-4 text-brand-faint" />
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-brand-faint">{stat.label}</p>
              <p className="mt-1 text-xl font-black text-brand-forest">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs font-black text-brand-faint">
          <span>Mastery</span>
          <span>{masteredPercent}%</span>
        </div>
        <div className="mt-2 h-2.5 rounded-full bg-brand-sand">
          <div
            className="h-2.5 rounded-full bg-brand-forest transition-all duration-500"
            style={{ width: `${masteredPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
