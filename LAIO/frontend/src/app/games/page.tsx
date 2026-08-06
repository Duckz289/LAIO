'use client';

import Link from 'next/link';
import { ArrowRight, Brain, Gamepad2, Keyboard, Layers3 } from 'lucide-react';

import AppShell from '@/components/AppShell';
import { useAuth } from '@/hooks/useAuth';

const gameModes = [
  { title: 'Flashcard sprint', description: 'Ôn nhanh các từ đang đến hạn trong phiên SRS.', icon: Layers3 },
  { title: 'Typing practice', description: 'Chế độ gõ đáp án sẽ được kết nối sau khi game API hoàn tất.', icon: Keyboard },
  { title: 'Word match', description: 'Ghép từ và nghĩa để luyện phản xạ.', icon: Brain },
];

export default function GamesPage() {
  const { user } = useAuth();

  return (
    <AppShell title="Games" userEmail={user?.email}>
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-xl shadow-indigo-100/40 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600"><Gamepad2 className="h-6 w-6" aria-hidden="true" /></div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-950">Practice games</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">Khu vực game đã có trạng thái rõ ràng để không làm mất layout khi backend game chưa sẵn sàng.</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {gameModes.map((mode, index) => {
            const Icon = mode.icon;
            return (
              <article key={mode.title} className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-sm">
                <div className="flex items-center justify-between"><div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600"><Icon className="h-5 w-5" aria-hidden="true" /></div><span className="text-xs font-bold text-slate-400">Mode {index + 1}</span></div>
                <h2 className="mt-5 text-lg font-black text-slate-950">{mode.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">{mode.description}</p>
              </article>
            );
          })}
        </section>

        <div className="rounded-3xl border border-indigo-100 bg-indigo-600 p-6 text-white shadow-lg shadow-indigo-200">
          <h2 className="text-lg font-black">Start with a review session</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-indigo-100">Các game mới đang chờ API tương ứng. Bạn vẫn có thể luyện ngay bằng flashcard SRS hiện có.</p>
          <Link href="/review" className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-indigo-700 hover:bg-indigo-50">Open review <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </div>
      </div>
    </AppShell>
  );
}
