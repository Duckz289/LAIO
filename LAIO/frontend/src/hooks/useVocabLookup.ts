'use client';

import { useEffect, useRef, useState } from 'react';

import { api, VocabularyLookupResult } from '@/lib/api';

const DEBOUNCE_MS = 400;
const MIN_TERM_LENGTH = 2;

export type VocabLookupStatus = 'idle' | 'loading' | 'found' | 'not_found' | 'unavailable';

interface VocabLookupState {
  status: VocabLookupStatus;
  data: VocabularyLookupResult | null;
}

/**
 * Debounced, race-safe dictionary lookup for the Add Vocabulary flow.
 *
 * Guarantees that a slow/out-of-order response for a superseded term can
 * never apply to the UI: the in-flight request is aborted as soon as `term`
 * changes, and a `latestTerm` check double-guards against any response that
 * resolves anyway before its abort is observed.
 */
export function useVocabLookup(term: string, enabled: boolean): VocabLookupState {
  const [state, setState] = useState<VocabLookupState>({ status: 'idle', data: null });
  const latestTerm = useRef('');

  useEffect(() => {
    const trimmed = term.trim();
    latestTerm.current = trimmed;

    if (!enabled || trimmed.length < MIN_TERM_LENGTH) {
      setState({ status: 'idle', data: null });
      return;
    }

    const controller = new AbortController();
    setState({ status: 'loading', data: null });

    const timer = window.setTimeout(() => {
      api
        .lookupVocab(trimmed, { signal: controller.signal })
        .then((result) => {
          if (latestTerm.current !== trimmed) return;
          setState({ status: result.status, data: result });
        })
        .catch((error) => {
          if (controller.signal.aborted) return;
          if (latestTerm.current !== trimmed) return;
          console.warn('Vocabulary lookup failed:', error);
          setState({ status: 'unavailable', data: null });
        });
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [term, enabled]);

  return state;
}
