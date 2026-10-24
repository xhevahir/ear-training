export type PersistenceStatus = 'granted' | 'denied' | 'unsupported';

/** Asks the browser to protect stored data from automatic eviction. */
export async function requestPersistence(): Promise<PersistenceStatus> {
  if (!navigator.storage?.persist) return 'unsupported';
  try {
    if (await navigator.storage.persisted()) return 'granted';
    return (await navigator.storage.persist()) ? 'granted' : 'denied';
  } catch {
    return 'denied';
  }
}

export async function persistenceStatus(): Promise<PersistenceStatus> {
  if (!navigator.storage?.persisted) return 'unsupported';
  try {
    return (await navigator.storage.persisted()) ? 'granted' : 'denied';
  } catch {
    return 'denied';
  }
}
