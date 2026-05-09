import { Bot, InlineKeyboard } from "grammy";
import type { Context } from "grammy";
import { env } from "@/lib/env";
import { hashPassword } from "@/lib/security";
import { getCopy } from "@/features/bot/copy";
import {
  createAdminReviewKeyboard,
  createDepartmentKeyboard,
  createLanguageKeyboard,
  createRegionKeyboard,
} from "@/features/bot/keyboards";
import { BotRepository } from "@/features/bot/repository";
import { uploadTelegramPhotoToReceiptsBucket } from "@/features/bot/storage";
import { normalizePhoneNumber, validatePinPassword } from "@/features/bot/validators";
import type { AppLanguage } from "@/types/db";

type BotContext = Context;

function getRepository() {
  return new BotRepository();
}

function createMiniAppWebAppButton(label: string) {
  const webAppUrl = env.NEXT_PUBLIC_MINI_APP_URL ?? "https://aviation-cyan.vercel.app";

  return {
    reply_markup: new InlineKeyboard().webApp(label, webAppUrl),
  };
}

function parseLanguageCallback(data: string | undefined) {
  if (!data?.startsWith("lang:")) {
    return null;
  }

  const language = data.split(":")[1];
  return language === "en" || language === "am" ? language : null;
}

function parseSelectionCallback(prefix: "dept" | "region", data: string | undefined) {
  if (!data?.startsWith(`${prefix}:`)) {
    return null;
  }

  return data.slice(prefix.length + 1);
}

function parseReviewCallback(data: string | undefined) {
  const match = data?.match(/^review:(approve|reject):([a-f0-9-]+)$/i);

  if (!match) {
    return null;
  }

  return {
    action: match[1] as "approve" | "reject",
    submissionId: match[2],
  };
}

async function promptForDepartment(ctx: BotContext, language: AppLanguage) {
  const copy = getCopy(language);
  const departments = await getRepository().listDepartments(language);

  await ctx.reply(copy.askDepartment, {
    reply_markup: createDepartmentKeyboard(departments, language),
  });
}

async function promptForRegion(ctx: BotContext, language: AppLanguage) {
  const copy = getCopy(language);
  const regions = await getRepository().listRegions();

  await ctx.reply(copy.askRegion, {
    reply_markup: createRegionKeyboard(regions, language),
  });
}

function buildAdminReviewCaption(summary: {
  fullName: string;
  phoneNumber: string;
  language: AppLanguage;
  departmentLabel: string;
  regionLabel: string;
  telegramUserId: number;
  telegramUsername: string | null;
}) {
  return [
    "Registration Review",
    "",
    `Name: ${summary.fullName}`,
    `Department: ${summary.departmentLabel}`,
    `Region: ${summary.regionLabel}`,
    `Phone: ${summary.phoneNumber}`,
    `Language: ${summary.language === "am" ? "Amharic" : "English"}`,
    `Telegram ID: ${summary.telegramUserId}`,
    `Telegram Username: ${summary.telegramUsername ? `@${summary.telegramUsername}` : "N/A"}`,
  ].join("\n");
}

async function notifyAdminWithReviewCard(
  ctx: BotContext,
  summary: Awaited<ReturnType<BotRepository["submitDraft"]>>,
) {
  if (!env.TELEGRAM_ADMIN_CHAT_ID) {
    throw new Error("TELEGRAM_ADMIN_CHAT_ID is not configured.");
  }

  const chatId = Number(env.TELEGRAM_ADMIN_CHAT_ID);
  const caption = buildAdminReviewCaption(summary);
  const reviewKeyboard = createAdminReviewKeyboard(summary.submissionId);

  if (summary.receiptTelegramFileId) {
    await ctx.api.sendPhoto(chatId, summary.receiptTelegramFileId, {
      caption,
      reply_markup: reviewKeyboard,
    });
    return;
  }

  await ctx.api.sendMessage(chatId, caption, {
    reply_markup: reviewKeyboard,
  });
}

async function beginRegistration(ctx: BotContext) {
  const user = ctx.from;

  if (!user) {
    return;
  }

  const repository = getRepository();
  const candidate = await repository.ensureCandidate(user);

  if (candidate.current_registration_status === "pending_review") {
    await ctx.reply(
      getCopy(candidate.preferred_language).pendingReview,
      createMiniAppWebAppButton("Open the Mini App"),
    );
    return;
  }

  if (candidate.current_registration_status === "approved") {
    await ctx.reply(
      getCopy(candidate.preferred_language).alreadyApproved,
      createMiniAppWebAppButton("Open the Mini App"),
    );
    return;
  }

  if (candidate.current_registration_status === "rejected") {
    await ctx.reply(getCopy(candidate.preferred_language).rejectedStatus);
  }

  await repository.startDraft(candidate.id);

  await ctx.reply(getCopy("en").welcome, {
    reply_markup: createLanguageKeyboard(),
  });

  await ctx.reply(getCopy("en").chooseLanguage);
}

async function handleTextMessage(ctx: BotContext) {
  const user = ctx.from;
  const text = ctx.message?.text?.trim();

  if (!user || !text) {
    return;
  }

  const repository = getRepository();
  const candidate = await repository.ensureCandidate(user);
  let draft = await repository.getDraft(candidate.id);

  if (!draft) {
    draft = await repository.startDraft(candidate.id);
  }

  const language = draft.selected_language ?? candidate.preferred_language ?? "en";
  const copy = getCopy(language);

  switch (draft.current_step) {
    case "language":
      await ctx.reply(copy.chooseLanguage, {
        reply_markup: createLanguageKeyboard(),
      });
      return;
    case "full_name":
      draft = await repository.updateDraft(candidate.id, {
        full_name: text,
        current_step: "department",
        last_user_message_id: ctx.message?.message_id ?? null,
      });
      await promptForDepartment(ctx, draft.selected_language ?? language);
      return;
    case "phone_number": {
      const normalizedPhone = normalizePhoneNumber(text);

      if (!normalizedPhone) {
        await ctx.reply(copy.invalidPhone);
        return;
      }

      await repository.updateDraft(candidate.id, {
        phone_number: normalizedPhone,
        current_step: "password",
        last_user_message_id: ctx.message?.message_id ?? null,
      });
      await ctx.reply(copy.askPassword);
      return;
    }
    case "password": {
      const password = validatePinPassword(text);

      if (!password) {
        await ctx.reply(copy.invalidPassword);
        return;
      }

      await repository.updateDraft(candidate.id, {
        password_hash: hashPassword(password),
        current_step: "receipt",
        last_user_message_id: ctx.message?.message_id ?? null,
      });
      await ctx.reply(copy.paymentInstructions);
      return;
    }
    case "receipt":
      await ctx.reply(copy.receiptOnly);
      return;
    case "completed":
      await ctx.reply(copy.pendingReview);
      return;
    default:
      return;
  }
}

async function handlePhotoMessage(ctx: BotContext) {
  const user = ctx.from;
  const photo = ctx.message?.photo?.at(-1);

  if (!user || !photo) {
    return;
  }

  const repository = getRepository();
  const candidate = await repository.ensureCandidate(user);
  const draft = await repository.getDraft(candidate.id);

  if (!draft) {
    await beginRegistration(ctx);
    return;
  }

  const language = draft.selected_language ?? candidate.preferred_language ?? "en";
  const copy = getCopy(language);

  if (draft.current_step !== "receipt") {
    await ctx.reply(copy.receiptOnly);
    return;
  }

  const telegramFile = await ctx.api.getFile(photo.file_id);

  if (!telegramFile.file_path) {
    throw new Error("Telegram file path is missing.");
  }

  const upload = await uploadTelegramPhotoToReceiptsBucket({
    filePath: telegramFile.file_path,
    fileId: photo.file_id,
    telegramUserId: user.id,
  });

  const updatedDraft = await repository.updateDraft(candidate.id, {
    receipt_storage_path: upload.storagePath,
    receipt_telegram_file_id: photo.file_id,
    receipt_file_name: upload.fileName,
    receipt_mime_type: upload.contentType,
    receipt_uploaded_at: new Date().toISOString(),
    last_user_message_id: ctx.message?.message_id ?? null,
  });

  const summary = await repository.submitDraft(candidate, updatedDraft);

  await notifyAdminWithReviewCard(ctx, summary);

  if (env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME) {
    await ctx.reply(
      copy.pendingReview,
      createMiniAppWebAppButton(language === "am" ? "Mini App ክፈት" : "Open the Mini App"),
    );
    return;
  }

  await ctx.reply(copy.pendingReview);
}

async function handleCallbackQuery(ctx: BotContext) {
  const user = ctx.from;
  const callbackData = ctx.callbackQuery?.data;

  if (!user || !callbackData) {
    return;
  }

  const repository = getRepository();
  const candidate = await repository.ensureCandidate(user);
  let draft = await repository.getDraft(candidate.id);

  const languageSelection = parseLanguageCallback(callbackData);

  if (languageSelection) {
    draft = draft ?? (await repository.startDraft(candidate.id));
    await repository.updateDraft(candidate.id, {
      selected_language: languageSelection,
      current_step: "full_name",
    });

    await ctx.answerCallbackQuery();
    await ctx.reply(getCopy(languageSelection).languageChanged);
    await ctx.reply(getCopy(languageSelection).askFullName);
    return;
  }

  if (!draft) {
    draft = await repository.startDraft(candidate.id);
  }

  const language = draft.selected_language ?? candidate.preferred_language ?? "en";

  const departmentId = parseSelectionCallback("dept", callbackData);

  if (departmentId && draft.current_step === "department") {
    await repository.updateDraft(candidate.id, {
      department_id: departmentId,
      current_step: "region",
    });
    await ctx.answerCallbackQuery();
    await promptForRegion(ctx, language);
    return;
  }

  const regionId = parseSelectionCallback("region", callbackData);

  if (regionId && draft.current_step === "region") {
    await repository.updateDraft(candidate.id, {
      region_id: regionId,
      current_step: "phone_number",
    });
    await ctx.answerCallbackQuery();
    await ctx.reply(getCopy(language).askPhone);
    return;
  }

  const review = parseReviewCallback(callbackData);

  if (review) {
    const isAdmin = await repository.isAdminTelegramUser(user.id);

    if (!isAdmin) {
      await ctx.answerCallbackQuery({
        text: getCopy("en").adminOnly,
        show_alert: true,
      });
      return;
    }

    const submission = await repository.decideRegistrationReview({
      submissionId: review.submissionId,
      adminTelegramUserId: user.id,
      action: review.action,
    });

    await ctx.answerCallbackQuery();
    await ctx.api.sendMessage(
      submission.telegramUserId,
      review.action === "approve"
        ? getCopy(submission.preferredLanguage).userApproved
        : getCopy(submission.preferredLanguage).userRejected,
    );

    await ctx.reply(
      review.action === "approve"
        ? getCopy("en").adminApproved
        : getCopy("en").adminRejected,
    );
  }
}

export function createTelegramBot() {
  if (!env.TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured.");
  }

  const bot = new Bot(env.TELEGRAM_BOT_TOKEN);

  bot.command("start", beginRegistration);
  bot.on("callback_query:data", handleCallbackQuery);
  bot.on("message:text", handleTextMessage);
  bot.on("message:photo", handlePhotoMessage);

  return bot;
}
