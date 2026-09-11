import { useSyncExternalStore } from 'react';

export const SMALL_SCREEN_QUERY = '(max-width: 767px)';

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onStoreChange);
      return () => mql.removeEventListener('change', onStoreChange);
    },
    () => window.matchMedia(query).matches,
  );
}

export function useIsSmallScreen(): boolean {
  return useMediaQuery(SMALL_SCREEN_QUERY);
}
