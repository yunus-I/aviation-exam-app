import { InlineKeyboard } from "grammy";
import type { AppLanguage } from "@/types/db";
import type { LookupOption } from "@/features/bot/types";

export function createLanguageKeyboard() {
  return new InlineKeyboard()
    .text("English", "lang:en")
    .text("አማርኛ", "lang:am");
}

export function createDepartmentKeyboard(
  departments: LookupOption[],
  language: AppLanguage,
) {
  const keyboard = new InlineKeyboard();

  departments.forEach((department, index) => {
    const label =
      language === "am" && department.secondaryLabel
        ? department.secondaryLabel
        : department.label;

    keyboard.text(label, `dept:${department.id}`);

    if (index % 2 === 1) {
      keyboard.row();
    }
  });

  return keyboard;
}

export function createRegionKeyboard(
  regions: LookupOption[],
  language: AppLanguage,
) {
  const keyboard = new InlineKeyboard();

  regions.forEach((region, index) => {
    const label =
      language === "am" && region.secondaryLabel
        ? region.secondaryLabel
        : region.label;

    keyboard.text(label, `region:${region.id}`);

    if (index % 2 === 1) {
      keyboard.row();
    }
  });

  return keyboard;
}

export function createAdminReviewKeyboard(submissionId: string) {
  return new InlineKeyboard()
    .text("Approve", `review:approve:${submissionId}`)
    .text("Reject", `review:reject:${submissionId}`);
}
