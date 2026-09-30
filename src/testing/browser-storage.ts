type StorageName = 'localStorage' | 'sessionStorage';

function buildMemoryStore(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
    key: (index) => Array.from(store.keys())[index] ?? null,
    get length() { return store.size; },
  };
}

export function ensureBrowserStorage(name: StorageName): void {
  const storage = buildMemoryStore();
  for (const target of [globalThis, typeof window === 'undefined' ? null : window]) {
    if (target && typeof (target as Record<string, unknown>)[name] === 'undefined') {
      Object.defineProperty(target, name, { configurable: true, writable: true, value: storage });
    }
  }
}

ensureBrowserStorage('localStorage');
ensureBrowserStorage('sessionStorage');

if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  });
}
