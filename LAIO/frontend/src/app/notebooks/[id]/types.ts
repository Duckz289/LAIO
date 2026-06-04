// frontend/src/app/notebooks/[id]/types.ts

export interface Vocab {
  id: string;
  word: string;           // backend dùng "word"
  meaning: string;
  pronunciation: string;
  example_sentence: string; // backend dùng "example_sentence"
  difficulty_level: number;  // 0-5, backend dùng "difficulty_level"
  is_mastered: boolean;
  next_review_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Notebook {
  id: string;
  title: string;
  description: string;
  totalVocabs: number;
  masteredVocabs: number;
  dueVocabs: number;
}