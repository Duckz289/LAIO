// frontend/src/app/notebooks/[id]/components/VocabList.tsx

'use client';

import { Vocab } from '../types';
import VocabItem from './VocabItem';

interface VocabListProps {
  vocabs: Vocab[];
  onToggleMaster: (id: string) => void;
  onEdit: (vocab: Vocab) => void;
  onDelete: (id: string) => void;
}

export default function VocabList({ vocabs, onToggleMaster, onEdit, onDelete }: VocabListProps) {
  if (vocabs.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-2xl">
        <p className="text-gray-400">Chưa có từ vựng nào. Hãy thêm từ mới!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {vocabs.map((vocab) => (
        <VocabItem
          key={vocab.id}
          vocab={vocab}
          onToggleMaster={onToggleMaster}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}