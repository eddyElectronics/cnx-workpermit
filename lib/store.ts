import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { LiffProfile } from '@/lib/liff'
import { User } from '@/lib/api'

interface UserState {
  liffProfile: LiffProfile | null
  user: User | null
  setLiffProfile: (profile: LiffProfile | null) => void
  setUser: (user: User | null) => void
  clearUser: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      liffProfile: null,
      user: null,
      setLiffProfile: (profile) => set({ liffProfile: profile }),
      setUser: (user) => set({ user }),
      clearUser: () => set({ liffProfile: null, user: null }),
    }),
    {
      name: 'user-storage',
    }
  )
)
