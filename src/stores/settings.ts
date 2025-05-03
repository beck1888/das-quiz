import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsStore {
  isSoundEnabled: boolean;
  setIsSoundEnabled: (enabled: boolean) => void;
  forceEnglish: boolean;
  setForceEnglish: (enabled: boolean) => void;
}

export const useSettings = create<SettingsStore>()(
  persist(
    (set) => ({
      isSoundEnabled: true,
      setIsSoundEnabled: (enabled) => set({ isSoundEnabled: enabled }),
      forceEnglish: false,
      setForceEnglish: (enabled) => set({ forceEnglish: enabled }),
    }),
    {
      name: 'settings-storage',
    }
  )
);
