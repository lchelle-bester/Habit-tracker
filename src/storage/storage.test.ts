import { beforeEach, describe, expect, it, vi } from 'vitest'

function makeMemoryLocalStorage(): Storage {
  const map = new Map<string, string>()
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value)
    },
    removeItem: (key: string) => {
      map.delete(key)
    },
    clear: () => map.clear(),
    key: (i: number) => Array.from(map.keys())[i] ?? null,
    get length() {
      return map.size
    },
  } as Storage
}

beforeEach(() => {
  vi.stubGlobal('localStorage', makeMemoryLocalStorage())
  vi.useFakeTimers()
})

describe('storage', () => {
  it('loadAppData falls back to a fresh seed when nothing is stored', async () => {
    const { loadAppData } = await import('./storage')
    const data = loadAppData()
    expect(data.goals).toHaveLength(6)
  })

  it('loadAppData falls back to a fresh seed on corrupted JSON instead of throwing', async () => {
    localStorage.setItem('goal-tracker:app-data', '{not valid json')
    const { loadAppData } = await import('./storage')
    expect(() => loadAppData()).not.toThrow()
    expect(loadAppData().goals).toHaveLength(6)
  })

  it('persistAppData debounces rapid writes into a single localStorage.setItem', async () => {
    const { loadAppData, persistAppData } = await import('./storage')
    const data = loadAppData()
    const setItemSpy = vi.spyOn(localStorage, 'setItem')

    persistAppData({ ...data, settings: { theme: 'dark' } })
    persistAppData({ ...data, settings: { theme: 'light' } })
    persistAppData({ ...data, settings: { theme: 'system' } })
    expect(setItemSpy).not.toHaveBeenCalled()

    vi.runAllTimers()
    expect(setItemSpy).toHaveBeenCalledTimes(1)
    const written = JSON.parse(setItemSpy.mock.calls[0][1] as string)
    expect(written.settings.theme).toBe('system') // last write wins
  })

  it('flushPendingWrite forces an immediate write without waiting for the debounce timer', async () => {
    const { loadAppData, persistAppData, flushPendingWrite } = await import('./storage')
    const data = loadAppData()
    const setItemSpy = vi.spyOn(localStorage, 'setItem')

    persistAppData({ ...data, settings: { theme: 'dark' } })
    flushPendingWrite()
    expect(setItemSpy).toHaveBeenCalledTimes(1)
  })
})
