import { forwardRef, type CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TutorialCardProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  stepIndex?: number;
  stepCount?: number;
  primaryLabel: string;
  onPrimaryClick?: () => void;
  primaryDisabled?: boolean;
  secondaryLabel?: string;
  onSecondaryClick?: () => void;
  style?: CSSProperties;
}

/**
 * Purely presentational popup: icon + title + description + progress dots +
 * action button(s). Knows nothing about the tutorial engine — all content
 * and callbacks are passed in by whoever renders it (see TutorialOverlay).
 */
export const TutorialCard = forwardRef<HTMLDivElement, TutorialCardProps>(function TutorialCard(
  {
    icon: Icon = Sparkles,
    title,
    description,
    stepIndex,
    stepCount,
    primaryLabel,
    onPrimaryClick,
    primaryDisabled,
    secondaryLabel,
    onSecondaryClick,
    style,
  },
  ref,
) {
  return (
    <Card
      ref={ref}
      style={style}
      className={cn(
        "fixed z-[203] w-[calc(100vw-2rem)] max-w-sm p-4 shadow-lg",
        "animate-in fade-in zoom-in-95 slide-in-from-bottom-1 duration-300 ease-out",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>

      {typeof stepCount === "number" && stepCount > 1 && (
        <div className="mt-3 flex items-center gap-1">
          {Array.from({ length: stepCount }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === stepIndex ? "w-5 bg-primary" : "w-1.5 bg-muted",
              )}
            />
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-end gap-2">
        {secondaryLabel && (
          <Button variant="ghost" size="sm" onClick={onSecondaryClick}>
            {secondaryLabel}
          </Button>
        )}
        <Button size="sm" onClick={onPrimaryClick} disabled={primaryDisabled}>
          {primaryLabel}
        </Button>
      </div>
    </Card>
  );
});
