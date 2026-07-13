import type { TutorialDefinition } from "./types";

/**
 * In-memory registry of tutorial definitions. Feature code registers a
 * tutorial once (module load time) via `registerTutorial`, and the engine
 * looks it up by id when asked to start/restart it.
 *
 * To add a new tutorial later:
 *   1. Create `src/lib/tutorial/definitions/<name>.ts` exporting a
 *      `TutorialDefinition` with its `steps` filled in.
 *   2. Call `registerTutorial(myDefinition)` from that file (module-level
 *      side effect) and import the file once near app startup, e.g. from
 *      `src/routes/__root.tsx`.
 */

const registry = new Map<string, TutorialDefinition>();

export function registerTutorial(definition: TutorialDefinition): void {
  registry.set(definition.id, definition);
}

export function getTutorial(id: string): TutorialDefinition | undefined {
  return registry.get(id);
}

export function getRegisteredTutorialIds(): string[] {
  return Array.from(registry.keys());
}
