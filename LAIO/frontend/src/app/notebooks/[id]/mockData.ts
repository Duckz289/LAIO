// frontend/src/app/notebooks/[id]/mockData.ts

import { Vocab, Notebook } from './types';

export const mockNotebook: Notebook = {
  id: '1',
  title: 'IELTS Vocabulary',
  description: 'Từ vựng luyện thi IELTS',
  totalVocabs: 12,
  masteredVocabs: 5,
  dueVocabs: 3,
};

export const mockVocabs: Vocab[] = [
  {
    id: '1',
    word: 'analyze',
    meaning: 'phân tích',
    pronunciation: '/ˈæn.əl.aɪz/',
    example_sentence: 'We need to analyze the data carefully.',
    difficulty_level: 1,
    is_mastered: false,
    next_review_date: '2026-06-04',
    created_at: '2026-06-01',
    updated_at: '2026-06-01',
  },
  {
    id: '2',
    word: 'significant',
    meaning: 'đáng kể, quan trọng',
    pronunciation: '/sɪɡˈnɪf.ɪ.kənt/',
    example_sentence: 'There was a significant improvement.',
    difficulty_level: 0,
    is_mastered: false,
    next_review_date: '2026-06-03',
    created_at: '2026-06-01',
    updated_at: '2026-06-01',
  },
  {
    id: '3',
    word: 'consequence',
    meaning: 'hậu quả',
    pronunciation: '/ˈkɒn.sɪ.kwəns/',
    example_sentence: 'The consequences could be severe.',
    difficulty_level: 2,
    is_mastered: true,
    next_review_date: '2026-06-10',
    created_at: '2026-06-01',
    updated_at: '2026-06-01',
  },
];