import { afterEach, describe, expect, it, vi } from 'vitest';
import { persistenceStatus, requestPersistence } from '../src/storage/persistence';

function stubStorage(storage: Partial<StorageManager> | undefined) {
  vi.stubGlobal('navigator', { storage });
}

describe('persistent storage', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('reports granted when already persisted, without asking again', async () => {
    const persist = vi.fn();
    stubStorage({ persisted: async () => true, persist });
    expect(await requestPersistence()).toBe('granted');
    expect(persist).not.toHaveBeenCalled();
  });

  it('asks the browser and reports its answer', async () => {
    stubStorage({ persisted: async () => false, persist: async () => true });
    expect(await requestPersistence()).toBe('granted');
    stubStorage({ persisted: async () => false, persist: async () => false });
    expect(await requestPersistence()).toBe('denied');
  });

  it('handles browsers without the Storage API', async () => {
    stubStorage(undefined);
    expect(await requestPersistence()).toBe('unsupported');
    expect(await persistenceStatus()).toBe('unsupported');
  });
});
