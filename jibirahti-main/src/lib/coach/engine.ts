import { COACH_RULES } from "./rules";
import type { CoachAdvice, CoachContext } from "./types";

const PRIORITY_ORDER: Record<CoachAdvice["priority"], number> = {
  critical: 0,
  warning: 1,
  positive: 2,
};

/**
 * Runs every registered rule against the given context, flattens the
 * results, sorts them critical → warning → positive, and returns at most
 * `maxCount` (default 3).
 */
export function generateCoachAdvice(ctx: CoachContext, maxCount = 3): CoachAdvice[] {
  const advice: CoachAdvice[] = [];
  for (const rule of COACH_RULES) {
    const result = rule(ctx);
    if (!result) continue;
    if (Array.isArray(result)) advice.push(...result);
    else advice.push(result);
  }
  advice.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  return advice.slice(0, maxCount);
}
