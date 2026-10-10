// @ts-nocheck
import { env } from "@/lib/env";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function uploadTelegramPhotoToReceiptsBucket(params: {
  filePath: string;
  fileId: string;
  telegramUserId: number;
}) {
  if (!env.TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured.");
  }

  const response = await fetch(
    `https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${params.filePath}`,
  );

  if (!response.ok) {
    throw new Error("Failed to download receipt image from Telegram.");
  }

  const arrayBuffer = await response.arrayBuffer();
  let contentType = response.headers.get("content-type") ?? "image/jpeg";
  let fileExtension = "jpg";
  const lowerPath = params.filePath.toLowerCase();

  if (lowerPath.endsWith(".pdf") || contentType.includes("pdf")) {
    fileExtension = "pdf";
    contentType = "application/pdf";
  } else if (lowerPath.endsWith(".png") || contentType.includes("png")) {
    fileExtension = "png";
    contentType = "image/png";
  } else if (lowerPath.endsWith(".webp") || contentType.includes("webp")) {
    fileExtension = "webp";
    contentType = "image/webp";
  } else if (lowerPath.endsWith(".heic") || contentType.includes("heic")) {
    fileExtension = "heic";
  }
  const storagePath = `receipts/${params.telegramUserId}/${Date.now()}-${params.fileId}.${fileExtension}`;

  const upload = await getSupabaseAdminClient().storage
    .from("registration-receipts")
    .upload(storagePath, arrayBuffer, {
      contentType,
      upsert: false,
    });

  if (upload.error) {
    throw upload.error;
  }

  return {
    storagePath,
    contentType,
    fileName: `${params.fileId}.${fileExtension}`,
  };
}
