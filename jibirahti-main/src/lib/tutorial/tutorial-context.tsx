import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { getTutorial } from "./registry";
import { isTutorialCompleted, markTutorialCompleted } from "./storage";
import type { TutorialDefinition, TutorialStatus, TutorialStep } from "./types";

/**
 * Engine for the interactive walkthrough. Purely state + control flow —
 * it renders nothing itself (no overlay, no spotlight). A future
 * presentation layer reads `currentStep`/`isActive` from `useTutorial()`
 * and draws the UI; this step only builds the plumbing.
 */
interface TutorialContextValue {
  /** Definition currently running, or null if idle/completed. */
  activeTutorial: TutorialDefinition | null;
  /** Step currently shown, or null if nothing is active. */
  currentStep: TutorialStep | null;
  currentStepIndex: number;
  status: TutorialStatus;
  isActive: boolean;

  /** Start a tutorial if it hasn't been completed by this user yet. No-op otherwise (or if no user is signed in). */
  start: (tutorialId: string) => void;
  /** Force-start a tutorial regardless of its completed state (e.g. "replay" from Settings). */
  restart: (tutorialId: string) => void;
  /** Advance to the next step. Used by "info" steps (manual continue). */
  next: () => void;
  /** Report that `actionId` happened; advances only if the current step awaits it. */
  reportAction: (actionId: string) => void;
  /** Abort the running tutorial and mark it completed so it won't auto-start again. */
  skip: () => void;
  /** Whether `tutorialId` has already been completed/skipped by this user on this device. */
  isCompleted: (tutorialId: string) => boolean;
}

const TutorialContext = createContext<TutorialContextValue | undefined>(undefined);

export function TutorialProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [activeTutorial, setActiveTutorial] = useState<TutorialDefinition | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [status, setStatus] = useState<TutorialStatus>("idle");

  const finish = useCallback(
    (tutorialId: string) => {
      if (userId) markTutorialCompleted(tutorialId, userId);
      setActiveTutorial(null);
      setCurrentStepIndex(0);
      setStatus("completed");
    },
    [userId]
  );

  const beginTutorial = useCallback((tutorialId: string) => {
    const definition = getTutorial(tutorialId);
    if (!definition || definition.steps.length === 0) return;
    setActiveTutorial(definition);
    setCurrentStepIndex(0);
    setStatus("running");
  }, []);

  const start = useCallback(
    (tutorialId: string) => {
      // No signed-in user yet — there is no account to scope "completed" to.
      if (!userId) return;
      if (isTutorialCompleted(tutorialId, userId)) return;
      beginTutorial(tutorialId);
    },
    [beginTutorial, userId]
  );

  const restart = useCallback(
    (tutorialId: string) => {
      beginTutorial(tutorialId);
    },
    [beginTutorial]
  );

  const next = useCallback(() => {
    setActiveTutorial((tutorial) => {
      if (!tutorial) return tutorial;
      setCurrentStepIndex((index) => {
        const nextIndex = index + 1;
        if (nextIndex >= tutorial.steps.length) {
          finish(tutorial.id);
          return 0;
        }
        return nextIndex;
      });
      return tutorial;
    });
  }, [finish]);

  const reportAction = useCallback(
    (actionId: string) => {
      setActiveTutorial((tutorial) => {
        if (!tutorial) return tutorial;
        setCurrentStepIndex((index) => {
          const step = tutorial.steps[index];
          if (!step || step.kind !== "action" || step.actionId !== actionId) return index;
          const nextIndex = index + 1;
          if (nextIndex >= tutorial.steps.length) {
            finish(tutorial.id);
            return 0;
          }
          return nextIndex;
        });
        return tutorial;
      });
    },
    [finish]
  );

  const skip = useCallback(() => {
    setActiveTutorial((tutorial) => {
      if (tutorial) finish(tutorial.id);
      return null;
    });
  }, [finish]);

  const isCompleted = useCallback(
    (tutorialId: string) => (userId ? isTutorialCompleted(tutorialId, userId) : false),
    [userId]
  );

  const currentStep = activeTutorial?.steps[currentStepIndex] ?? null;

  const value = useMemo<TutorialContextValue>(
    () => ({
      activeTutorial,
      currentStep,
      currentStepIndex,
      status,
      isActive: status === "running" && activeTutorial !== null,
      start,
      restart,
      next,
      reportAction,
      skip,
      isCompleted,
    }),
    [activeTutorial, currentStep, currentStepIndex, status, start, restart, next, reportAction, skip, isCompleted]
  );

  return <TutorialContext.Provider value={value}>{children}</TutorialContext.Provider>;
}

export function useTutorial(): TutorialContextValue {
  const ctx = useContext(TutorialContext);
  if (!ctx) throw new Error("useTutorial must be used within a TutorialProvider");
  return ctx;
}
