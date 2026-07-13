/**
 * Core types for the interactive walkthrough engine.
 *
 * A tutorial is an ordered list of steps. Each step targets a DOM element
 * via `targetId` (matched against a `data-tutorial-id` attribute on the
 * target element — the overlay renderer, built later, is responsible for
 * locating it). A step is either:
 *  - "info": shown to the user, advanced manually (e.g. a "Next" button).
 *  - "action": shown to the user, but only advances once the app reports
 *    that `actionId` was performed (see `useTutorial().reportAction`).
 */

import type { LucideIcon } from "lucide-react";

export type TutorialStepKind = "info" | "action";

export type TutorialStepPlacement = "top" | "bottom" | "left" | "right" | "center";

interface TutorialStepBase {
  /** Unique within its tutorial. */
  id: string;
  /**
   * Matches the `data-tutorial-id` attribute of the element this step points at.
   * Omit for a step with no specific target (renders centered, no spotlight —
   * e.g. a welcome/closing screen).
   */
  targetId?: string;
  /** i18n key resolved via tr(lang, titleKey). */
  titleKey: string;
  /** i18n key resolved via tr(lang, descriptionKey). */
  descriptionKey: string;
  /** Icon shown in the tutorial card. Defaults to a generic icon if omitted. */
  icon?: LucideIcon;
  /**
   * i18n key for the primary button label. Falls back to the engine's
   * generic "Next"/"Done" chrome text when omitted.
   */
  primaryLabelKey?: string;
  placement?: TutorialStepPlacement;
  /**
   * Opt-in stronger visual emphasis on the target: adds a pulse animation to
   * the spotlight ring and an animated arrow, instead of the default static
   * highlight. Off by default so existing steps keep their current look.
   */
  emphasize?: boolean;
  /**
   * Optional larger "safe zone" (matched by `data-tutorial-id`) the spotlight
   * hole should cover instead of just `targetId`'s own rect — e.g. the whole
   * dialog/card housing the target. Use this when the target lives inside a
   * Radix Dialog/Popover: without it, the spotlight would darken (and block
   * clicks on) the rest of that dialog, and any click landing on the
   * spotlight's own overlay — which sits outside the dialog's DOM subtree —
   * is treated by Radix as an "outside click" and auto-dismisses it. The
   * visual highlight (glow ring / pulse / arrow) still tracks `targetId`.
   */
  safeAreaId?: string;
}

export interface TutorialInfoStep extends TutorialStepBase {
  kind: "info";
}

export interface TutorialActionStep extends TutorialStepBase {
  kind: "action";
  /** Identifier the UI reports via reportAction(actionId) once the expected action happens. */
  actionId: string;
}

export type TutorialStep = TutorialInfoStep | TutorialActionStep;

export interface TutorialDefinition {
  /** Unique tutorial identifier, also used as the persisted "completed" key. */
  id: string;
  steps: TutorialStep[];
}

export type TutorialStatus = "idle" | "running" | "completed";
