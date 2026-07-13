import { Sparkles, Settings, Wallet, Save, PiggyBank, Plus, PlusCircle, PartyPopper } from "lucide-react";
import { registerTutorial } from "../registry";
import { ONBOARDING_TUTORIAL_ID } from "../constants";
import type { TutorialDefinition } from "../types";

/**
 * JIBI RAHTI's first-run guide: 5 steps, fully driven by the existing
 * tutorial engine (no new system). Two "info" steps (welcome / congrats)
 * advance manually; three "action" steps only advance once the matching
 * `reportAction(actionId)` call fires from the real UI:
 *   - "settings-opened"      → src/routes/settings.tsx (on mount)
 *   - "income-saved"         → src/routes/settings.tsx, handleSaveIncome() (click on the income "Enregistrer" button, on confirmed Supabase success)
 *   - "add-category-opened"  → src/routes/settings.tsx, CategorySection.openAdd() (click on "Ajouter une catégorie")
 *   - "budget-saved"         → src/routes/settings.tsx, CategorySection.save() (click on the dialog's "Enregistrer", on confirmed Supabase success)
 *   - "expense-added"        → src/routes/add.tsx (after addExpense succeeds)
 */
export const onboardingTutorial: TutorialDefinition = {
  id: ONBOARDING_TUTORIAL_ID,
  steps: [
    {
      id: "welcome",
      kind: "info",
      icon: Sparkles,
      titleKey: "tutOnboardingWelcomeTitle",
      descriptionKey: "tutOnboardingWelcomeDesc",
      primaryLabelKey: "tutOnboardingWelcomeButton",
      placement: "center",
    },
    {
      id: "open-settings",
      kind: "action",
      targetId: "settings-nav-btn",
      actionId: "settings-opened",
      icon: Settings,
      titleKey: "tutOnboardingSettingsTitle",
      descriptionKey: "tutOnboardingSettingsDesc",
      placement: "top",
      emphasize: true,
    },
    {
      id: "income-input",
      kind: "info",
      targetId: "settings-income-input",
      icon: Wallet,
      titleKey: "tutOnboardingIncomeTitle",
      descriptionKey: "tutOnboardingIncomeDesc",
      placement: "bottom",
    },
    {
      id: "income-save",
      kind: "action",
      targetId: "settings-income-save-btn",
      actionId: "income-saved",
      icon: Save,
      titleKey: "tutOnboardingIncomeSaveTitle",
      descriptionKey: "tutOnboardingIncomeSaveDesc",
      placement: "bottom",
      emphasize: true,
    },
    {
      id: "budget-category-intro",
      kind: "info",
      targetId: "settings-budget-zone",
      icon: PiggyBank,
      titleKey: "tutOnboardingBudgetIntroTitle",
      descriptionKey: "tutOnboardingBudgetIntroDesc",
      placement: "bottom",
    },
    {
      id: "budget-add-category",
      kind: "action",
      targetId: "settings-add-category-btn",
      actionId: "add-category-opened",
      icon: Plus,
      titleKey: "tutOnboardingBudgetAddCategoryTitle",
      descriptionKey: "tutOnboardingBudgetAddCategoryDesc",
      placement: "top",
      emphasize: true,
    },
    {
      id: "budget-save-category",
      kind: "action",
      targetId: "settings-category-save-btn",
      // Widen the blocking hole to the whole dialog: the target lives inside
      // a Radix Dialog, and without this, clicking the name/budget fields
      // (still needed at this point) would land on our own overlay and
      // Radix would treat that as an "outside click", auto-closing the
      // dialog before the user can reach the Save button.
      safeAreaId: "settings-category-dialog",
      actionId: "budget-saved",
      icon: Save,
      titleKey: "tutOnboardingBudgetSaveTitle",
      descriptionKey: "tutOnboardingBudgetSaveDesc",
      placement: "top",
      emphasize: true,
    },
    {
      id: "add-expense",
      kind: "action",
      targetId: "add-expense-btn",
      actionId: "expense-added",
      icon: PlusCircle,
      titleKey: "tutOnboardingExpenseTitle",
      descriptionKey: "tutOnboardingExpenseDesc",
      placement: "top",
    },
    {
      id: "congrats",
      kind: "info",
      icon: PartyPopper,
      titleKey: "tutOnboardingCongratsTitle",
      descriptionKey: "tutOnboardingCongratsDesc",
      primaryLabelKey: "tutOnboardingCongratsButton",
      placement: "center",
    },
  ],
};

registerTutorial(onboardingTutorial);
