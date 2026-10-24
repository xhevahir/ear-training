import type { Clock, VisibilitySource } from './ports';

export const browserClock: Clock = { now: () => performance.now() };

export const documentVisibility: VisibilitySource = {
  isVisible: () => document.visibilityState === 'visible',
  subscribe(listener) {
    const handler = () => listener(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  },
};
