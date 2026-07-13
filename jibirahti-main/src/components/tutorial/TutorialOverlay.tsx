import { useLayoutEffect, useRef, useState } from "react";
import { useTutorial } from "@/lib/tutorial";
import { useBudget } from "@/lib/budget-store";
import { useTargetRect } from "./use-target-rect";
import { computeCardPosition } from "./use-card-placement";
import { TutorialSpotlight } from "./TutorialSpotlight";
import { TutorialArrow } from "./TutorialArrow";
import { TutorialCard } from "./TutorialCard";

const FALLBACK_CARD_SIZE = { width: 320, height: 168 };

/**
 * Global orchestrator: reads the active step from `useTutorial()`, locates
 * its target element, computes where the card/arrow/spotlight should sit,
 * and renders them. Renders nothing when no tutorial is running. Mount once
 * near the app root (see src/routes/__root.tsx) — it is a no-op until a
 * tutorial with steps is registered and started.
 */
export function TutorialOverlay() {
  const { isActive, currentStep, currentStepIndex, activeTutorial, next, skip } = useTutorial();
  const { t } = useBudget();
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardSize, setCardSize] = useState(FALLBACK_CARD_SIZE);

  const targetId = isActive ? currentStep?.targetId : undefined;
  const { rect, status } = useTargetRect(targetId);

  // Optional wider "safe zone" (e.g. the whole dialog housing the target) the
  // spotlight hole should expand to, so clicks on sibling controls inside it
  // aren't swallowed by our own overlay — see TutorialStep.safeAreaId.
  const safeAreaId = isActive ? currentStep?.safeAreaId : undefined;
  const { rect: safeAreaRect, status: safeAreaStatus } = useTargetRect(safeAreaId);

  useLayoutEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    if (width && height && (width !== cardSize.width || height !== cardSize.height)) {
      setCardSize({ width, height });
    }
  });

  if (!isActive || !currentStep) return null;

  // While resolving a target (fresh step, or mid route-change), avoid
  // flashing the card at a stale/incorrect position — show just the dim
  // backdrop until the element is found (or confirmed absent).
  const effectiveRect = status === "found" ? rect : null;
  const showCard = !currentStep.targetId || status === "found" || status === "missing";

  // The hole (blocking cutout) covers the safe area when one is declared —
  // falling back to the target's own rect otherwise, which is exactly
  // today's behavior for every step that doesn't set `safeAreaId`.
  const holeRect = currentStep.safeAreaId
    ? (safeAreaStatus === "found" ? safeAreaRect : null)
    : effectiveRect;

  const { top, left, placement } = computeCardPosition(
    effectiveRect,
    cardSize,
    currentStep.placement ?? "bottom",
  );

  const isActionStep = currentStep.kind === "action";
  const isLastStep = activeTutorial ? currentStepIndex === activeTutorial.steps.length - 1 : false;

  return (
    <>
      <TutorialSpotlight rect={holeRect} highlightRect={effectiveRect} emphasize={currentStep.emphasize} />

      {effectiveRect && showCard && (
        <TutorialArrow
          placement={placement}
          cardPos={{ top, left }}
          cardSize={cardSize}
          targetRect={effectiveRect}
          animated={currentStep.emphasize}
        />
      )}

      {showCard && (
        <TutorialCard
          ref={cardRef}
          icon={currentStep.icon}
          title={t(currentStep.titleKey)}
          description={t(currentStep.descriptionKey)}
          stepIndex={currentStepIndex}
          stepCount={activeTutorial?.steps.length}
          style={{ top, left }}
          primaryLabel={
            isActionStep
              ? t("tutorialWaitingHint")
              : currentStep.primaryLabelKey
                ? t(currentStep.primaryLabelKey)
                : isLastStep
                  ? t("tutorialDoneButton")
                  : t("tutorialNextButton")
          }
          onPrimaryClick={isActionStep ? undefined : next}
          primaryDisabled={isActionStep}
          secondaryLabel={t("tutorialSkipButton")}
          onSecondaryClick={skip}
        />
      )}
    </>
  );
}
