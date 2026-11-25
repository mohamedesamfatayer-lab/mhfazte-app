import { create } from 'zustand'

type ErrorEntry = {
  id: string
  table: string
  op: 'read' | 'write'
  message: string
  ts: number
  persistent: boolean
}

type ErrorLogStore = {
  errors: ErrorEntry[]
  setRead: (table: string, message: string) => void
  clearRead: (table: string) => void
  addWrite: (table: string, message: string) => void
  dismissAll: () => void
}

export const useErrorLog = create<ErrorLogStore>((set) => ({
  errors: [],

  setRead: (table, message) => {
    set((s) => ({
      errors: [
        ...s.errors.filter((e) => !(e.table === table && e.op === 'read')),
        { id: crypto.randomUUID(), table, op: 'read', message, ts: Date.now(), persistent: true },
      ],
    }))
  },

  clearRead: (table) => {
    set((s) => ({
      errors: s.errors.filter((e) => !(e.table === table && e.op === 'read')),
    }))
  },

  addWrite: (table, message) => {
    const id = crypto.randomUUID()
    set((s) => ({
      errors: [...s.errors, { id, table, op: 'write', message, ts: Date.now(), persistent: false }],
    }))
    setTimeout(() => {
      set((s) => ({ errors: s.errors.filter((e) => e.id !== id) }))
    }, 5000)
  },

  dismissAll: () => set({ errors: [] }),
}))
