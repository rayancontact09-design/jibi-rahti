/**
 * Device-local persistence of "which tutorials has this user already
 * completed/skipped", scoped per user id — mirrors the localStorage pattern
 * used elsewhere in the app (see src/components/InstallPrompt.tsx,
 * src/i18n/translations.ts). Wrapped in try/catch since localStorage can
 * throw (private mode, quota).
 *
 * Scoping by user id (rather than one flat flag for the whole browser)
 * matters: without it, any account that has ever completed or skipped a
 * tutorial on a given device would permanently block that same tutorial
 * from auto-starting for every *other* account signing up later on that
 * same browser (shared computer, or repeated test signups) — even though
 * those accounts never saw it.
 */

const STORAGE_KEY = "jibi_tutorial_completed";

type CompletedByUser = Record<string, string[]>;

function readStore(): CompletedByUser {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: CompletedByUser): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {}
}

export function isTutorialCompleted(tutorialId: string, userId: string): boolean {
  const store = readStore();
  return (store[userId] ?? []).includes(tutorialId);
}

export function markTutorialCompleted(tutorialId: string, userId: string): void {
  const store = readStore();
  const ids = new Set(store[userId] ?? []);
  ids.add(tutorialId);
  store[userId] = Array.from(ids);
  writeStore(store);
}

export function clearTutorialCompleted(tutorialId: string, userId: string): void {
  const store = readStore();
  store[userId] = (store[userId] ?? []).filter((id) => id !== tutorialId);
  writeStore(store);
}
