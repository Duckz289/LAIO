export interface Vocab {
  id: string;
  word: string;
  meaning: string;
  pronunciation: string | null;
  audio_url: string;
  example_sentence: string;
  difficulty_level: number;
  is_mastered: boolean;
  next_review_date?: string | null;
  repetition_count?: number;
  interval_days?: number;
  ease_factor?: number;
  created_at: string;
  updated_at: string;
}

export type VocabMutation = Pick<
  Vocab,
  | 'word'
  | 'meaning'
  | 'pronunciation'
  | 'example_sentence'
  | 'difficulty_level'
  | 'is_mastered'
>;

export interface Notebook {
  id: string;
  title: string;
  description: string;
  totalVocabs: number;
  masteredVocabs: number;
  dueVocabs: number;
}

export type VocabFilter = 'all' | 'due' | 'mastered';
