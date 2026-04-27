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
  const contentType = response.headers.get("content-type") ?? "image/jpeg";
  const fileExtension = contentType.includes("png") ? "png" : "jpg";
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
