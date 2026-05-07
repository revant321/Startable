import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import type { AppSettings } from '../types';

const SINGLETON_ID = 1;

export const DEFAULT_SETTINGS: AppSettings = {
  id: SINGLETON_ID,
  theme: 'system',
  defaultSessionMinutes: 20,
  timerSoundEnabled: false,
};

let ensurePromise: Promise<void> | null = null;
async function ensureSettings(): Promise<void> {
  if (!ensurePromise) {
    ensurePromise = (async () => {
      const existing = await db.appSettings.get(SINGLETON_ID);
      if (!existing) await db.appSettings.put(DEFAULT_SETTINGS);
    })();
  }
  return ensurePromise;
}

void ensureSettings();

export function useSettings(): AppSettings {
  const settings = useLiveQuery(() => db.appSettings.get(SINGLETON_ID));
  return settings ?? DEFAULT_SETTINGS;
}

export async function updateSettings(patch: Partial<AppSettings>): Promise<void> {
  await ensureSettings();
  await db.appSettings.update(SINGLETON_ID, patch);
}
